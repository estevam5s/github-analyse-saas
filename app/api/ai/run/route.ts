import { NextResponse } from "next/server";

import { AI } from "@/lib/openrouter";
import { aggregateRepos } from "@/lib/github";
import { createAdminClient, getAccessForUser, getUserFromRequest, logAudit, type Limits } from "@/lib/saas";
import { getAiUsageThisMonth, getUserGitHub } from "@/lib/gh-server";

export const runtime = "nodejs";
export const maxDuration = 60;

// kind → feature exigida no plano
const REQUIRED: Record<string, keyof Limits | null> = {
  overview: null,
  explain: null,
  review: "code_review_ai",
  readme: "code_review_ai",
  commit: "code_review_ai",
  architecture: "advanced_analytics",
  quality: "advanced_analytics",
  vuln: "vuln_scan",
};

export async function POST(req: Request) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const kind = String(body.kind || "overview");
  const repoFull = String(body.repo || ""); // owner/name
  if (!REQUIRED.hasOwnProperty(kind)) return NextResponse.json({ error: "invalid_kind" }, { status: 400 });

  const access = await getAccessForUser(user.id, user.email ?? null);

  // gating de recurso
  const feat = REQUIRED[kind];
  if (feat && !access.limits[feat]) {
    return NextResponse.json({ error: "plan_required", feature: feat, plan: access.plan_slug }, { status: 402 });
  }

  // gating de cota de IA
  const limit = access.limits.ai_per_month;
  const used = await getAiUsageThisMonth(user.id);
  if (limit !== -1 && used >= limit) {
    return NextResponse.json({ error: "ai_limit", used, limit }, { status: 402 });
  }

  const gh = await getUserGitHub(user.id);
  if (!gh) return NextResponse.json({ error: "github_not_connected" }, { status: 400 });

  const [owner, name] = repoFull.split("/");
  let output = "";

  try {
    if (kind === "overview" || kind === "explain") {
      const repo = owner && name ? await gh.client.repo(owner, name) : null;
      const readme = owner && name ? await gh.client.readme(owner, name) : null;
      output = await AI.repoOverview({
        name: repoFull || "repositório",
        description: repo?.description,
        language: repo?.language,
        topics: repo?.topics,
        readme,
      });
    } else if (kind === "readme") {
      const repo = await gh.client.repo(owner, name);
      output = await AI.readme({ name: repoFull, description: repo?.description, language: repo?.language });
    } else if (kind === "architecture") {
      const repos = await gh.client.listRepos();
      const tree = repos.filter((r) => r.full_name.startsWith(owner + "/")).map((r) => r.full_name).join("\n");
      output = await AI.architecture({ name: repoFull || owner, tree: tree || repoFull });
    } else if (kind === "review" || kind === "vuln") {
      const code = body.code
        ? String(body.code)
        : (await gh.client.readme(owner, name)) || "(não foi possível obter o conteúdo)";
      const fn = kind === "review" ? AI.codeReview : AI.vulnScan;
      output = await fn({ filename: body.filename || `${name}/README`, code });
    } else if (kind === "quality") {
      const repos = await gh.client.listRepos();
      const repo = repos.find((r) => r.full_name === repoFull);
      const m = aggregateRepos(repos);
      const q = await AI.qualityScore({
        name: repoFull,
        signals: {
          stars: repo?.stargazers_count,
          forks: repo?.forks_count,
          open_issues: repo?.open_issues_count,
          archived: repo?.archived,
          language: repo?.language,
          pushed_at: repo?.pushed_at,
          total_repos: m.totalRepos,
        },
      });
      output = JSON.stringify(q);
    } else if (kind === "commit") {
      output = await AI.commitMessage(String(body.changes || body.code || ""));
    }
  } catch {
    return NextResponse.json({ error: "ai_failed" }, { status: 500 });
  }

  // metering + histórico
  const admin = createAdminClient();
  const period = new Date().toISOString().slice(0, 7);
  await admin.rpc("increment_ai_usage", { p_user: user.id, p_period: period });
  await admin.from("ai_jobs").insert({
    user_id: user.id,
    repo_full_name: repoFull || null,
    kind,
    status: "done",
    input: { repo: repoFull, filename: body.filename ?? null },
    output: output.slice(0, 20000),
  });
  await logAudit({ actor: user.email, actor_id: user.id, action: `ai.${kind}`, target: repoFull });

  return NextResponse.json({ ok: true, kind, output, used: used + 1, limit });
}
