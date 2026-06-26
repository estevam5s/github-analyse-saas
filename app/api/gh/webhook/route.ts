import { NextResponse } from "next/server";

import { AI } from "@/lib/openrouter";
import { GitHubClient } from "@/lib/github";
import { createAdminClient, getAccessForUser, isAdminEmail, logAudit } from "@/lib/saas";

export const runtime = "nodejs";
export const maxDuration = 60;

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "GitAnalytica";

async function hmacHex(secret: string, payload: string) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return Array.from(new Uint8Array(mac)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function POST(req: Request) {
  const event = req.headers.get("x-github-event") || "";
  const sig = (req.headers.get("x-hub-signature-256") || "").replace("sha256=", "");
  const payload = await req.text();

  if (event === "ping") return NextResponse.json({ ok: true, pong: true });
  if (event !== "pull_request") return NextResponse.json({ ok: true, ignored: event });

  let body: any;
  try { body = JSON.parse(payload); } catch { return NextResponse.json({ error: "bad_payload" }, { status: 400 }); }

  const action = body.action;
  if (!["opened", "reopened", "synchronize", "ready_for_review"].includes(action)) {
    return NextResponse.json({ ok: true, skipped: action });
  }

  const repoFull: string = body.repository?.full_name;
  const number: number = body.pull_request?.number;
  const title: string = body.pull_request?.title || "";
  if (!repoFull || !number) return NextResponse.json({ error: "missing_fields" }, { status: 400 });

  const admin = createAdminClient();
  const { data: hooks } = await admin
    .from("gh_webhooks")
    .select("user_id,secret,auto_review,active")
    .eq("repo_full_name", repoFull)
    .eq("active", true);

  // encontra o registro cujo secret valida a assinatura
  let match: any = null;
  for (const h of hooks ?? []) {
    if (h.secret && (await hmacHex(h.secret, payload)) === sig) { match = h; break; }
  }
  if (!match) return NextResponse.json({ error: "bad_signature" }, { status: 401 });
  if (!match.auto_review) return NextResponse.json({ ok: true, disabled: true });

  // dono + gating
  const { data: prof } = await admin.from("profiles").select("email").eq("id", match.user_id).maybeSingle();
  const access = await getAccessForUser(match.user_id, prof?.email ?? null);
  if (!access.limits.code_review_ai) {
    await admin.from("pr_reviews").insert({ user_id: match.user_id, repo_full_name: repoFull, pr_number: number, pr_title: title, status: "skipped", summary: "plano sem code review IA" });
    return NextResponse.json({ ok: true, skipped: "plan" });
  }
  // cota de IA
  const period = new Date().toISOString().slice(0, 7);
  const { data: usage } = await admin.from("app_usage").select("count").eq("user_id", match.user_id).eq("kind", "ai").eq("period", period).maybeSingle();
  const used = usage?.count ?? 0;
  if (access.limits.ai_per_month !== -1 && used >= access.limits.ai_per_month && !isAdminEmail(prof?.email)) {
    await admin.from("pr_reviews").insert({ user_id: match.user_id, repo_full_name: repoFull, pr_number: number, pr_title: title, status: "skipped", summary: "cota de IA atingida" });
    return NextResponse.json({ ok: true, skipped: "quota" });
  }

  // token do dono
  const { data: conn } = await admin.from("github_connections").select("access_token").eq("user_id", match.user_id).maybeSingle();
  if (!conn?.access_token) return NextResponse.json({ ok: true, skipped: "no_token" });

  const [owner, name] = repoFull.split("/");
  const client = new GitHubClient(conn.access_token);

  // monta o diff (limitado) e roda o review
  const files = await client.pullFiles(owner, name, number);
  const diff = files
    .slice(0, 20)
    .map((f) => `### ${f.filename} (+${f.additions}/-${f.deletions})\n${(f.patch || "").slice(0, 1500)}`)
    .join("\n\n");

  let summary = "";
  try {
    summary = await AI.codeReview({ filename: `PR #${number} — ${title}`, code: diff || "(sem diff disponível)" });
  } catch {
    await admin.from("pr_reviews").insert({ user_id: match.user_id, repo_full_name: repoFull, pr_number: number, pr_title: title, status: "error", files_changed: files.length });
    return NextResponse.json({ ok: false, error: "ai_failed" });
  }

  const reviewBody = `🤖 **Code review automático — ${APP_NAME}**\n\n${summary}\n\n---\n_Gerado por IA com base em ${files.length} arquivo(s) alterado(s). Revise antes de mesclar._`;
  const posted = await client.createReview(owner, name, number, reviewBody, "COMMENT");

  await admin.rpc("increment_ai_usage", { p_user: match.user_id, p_period: period });
  await admin.from("pr_reviews").insert({
    user_id: match.user_id, repo_full_name: repoFull, pr_number: number, pr_title: title,
    status: "done", summary: summary.slice(0, 8000), files_changed: files.length, posted: posted.ok,
  });
  await logAudit({ actor_id: match.user_id, action: "automation.pr_review.run", target: `${repoFull}#${number}`, detail: { posted: posted.ok } });

  return NextResponse.json({ ok: true, posted: posted.ok, files: files.length });
}
