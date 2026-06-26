import { NextResponse } from "next/server";

import { createAdminClient, getAccessForUser, getUserFromRequest, logAudit } from "@/lib/saas";
import { getUserGitHub } from "@/lib/gh-server";

export const runtime = "nodejs";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://github-analyse-saas.vercel.app";

export async function GET(req: Request) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const admin = createAdminClient();
  const [{ data: hooks }, { data: reviews }] = await Promise.all([
    admin.from("gh_webhooks").select("repo_full_name,auto_review,active,created_at").eq("user_id", user.id),
    admin.from("pr_reviews").select("repo_full_name,pr_number,pr_title,status,summary,files_changed,posted,created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(30),
  ]);
  return NextResponse.json({ hooks: hooks ?? [], reviews: reviews ?? [] });
}

export async function POST(req: Request) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const access = await getAccessForUser(user.id, user.email ?? null);
  if (!access.limits.code_review_ai) return NextResponse.json({ error: "plan_required" }, { status: 402 });

  const gh = await getUserGitHub(user.id);
  if (!gh) return NextResponse.json({ error: "github_not_connected" }, { status: 400 });

  const { action, repo } = await req.json().catch(() => ({}));
  const [owner, name] = String(repo || "").split("/");
  if (!owner || !name) return NextResponse.json({ error: "invalid_repo" }, { status: 400 });

  const admin = createAdminClient();

  if (action === "enable") {
    const secret = "whsec_" + crypto.randomUUID().replace(/-/g, "");
    const hook = await gh.client.createWebhook(owner, name, `${APP_URL}/api/gh/webhook`, secret, ["pull_request"]);
    if (!hook.ok && hook.status !== 422) {
      return NextResponse.json({ error: hook.message || "github_error" }, { status: 400 });
    }
    await admin.from("gh_webhooks").upsert(
      { user_id: user.id, repo_full_name: repo, gh_hook_id: hook.id ?? null, secret, events: ["pull_request"], auto_review: true, active: true },
      { onConflict: "user_id,repo_full_name" },
    );
    await logAudit({ actor: user.email, actor_id: user.id, action: "automation.pr_review.enable", target: repo });
    return NextResponse.json({ ok: true });
  }

  if (action === "disable") {
    const { data: rec } = await admin.from("gh_webhooks").select("gh_hook_id").eq("user_id", user.id).eq("repo_full_name", repo).maybeSingle();
    if (rec?.gh_hook_id) await gh.client.deleteWebhook(owner, name, rec.gh_hook_id);
    await admin.from("gh_webhooks").delete().eq("user_id", user.id).eq("repo_full_name", repo);
    await logAudit({ actor: user.email, actor_id: user.id, action: "automation.pr_review.disable", target: repo });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "invalid_action" }, { status: 400 });
}
