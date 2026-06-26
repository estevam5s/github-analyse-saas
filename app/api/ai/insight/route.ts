import { NextResponse } from "next/server";

import { aiChat } from "@/lib/openrouter";
import { createAdminClient, getAccessForUser, getUserFromRequest, logAudit } from "@/lib/saas";
import { getAiUsageThisMonth } from "@/lib/gh-server";

export const runtime = "nodejs";
export const maxDuration = 60;

/** Insight de IA sobre métricas DORA (gated advanced_analytics + metering). */
export async function POST(req: Request) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const access = await getAccessForUser(user.id, user.email ?? null);
  if (!access.limits.advanced_analytics) return NextResponse.json({ error: "plan_required" }, { status: 402 });

  const used = await getAiUsageThisMonth(user.id);
  if (access.limits.ai_per_month !== -1 && used >= access.limits.ai_per_month)
    return NextResponse.json({ error: "ai_limit", used, limit: access.limits.ai_per_month }, { status: 402 });

  const { repo, metrics } = await req.json().catch(() => ({}));
  const output = await aiChat(
    "Você é um coach de DevOps/Engineering Excellence especialista em DORA. Responda em português do Brasil, objetivo e acionável. Use seções: Diagnóstico, Prioridades (top 3) e Próximos passos. Marcadores '[+]'.",
    `Repositório: ${repo}\nMétricas DORA:\n${JSON.stringify(metrics, null, 2)}\n\nExplique o que os números indicam e como evoluir cada métrica para o nível Elite.`,
    { maxTokens: 1000 },
  );

  const admin = createAdminClient();
  const period = new Date().toISOString().slice(0, 7);
  await admin.rpc("increment_ai_usage", { p_user: user.id, p_period: period });
  await admin.from("ai_jobs").insert({ user_id: user.id, repo_full_name: repo || null, kind: "dora_insight", status: "done", output: output.slice(0, 12000) });
  await logAudit({ actor: user.email, actor_id: user.id, action: "ai.dora_insight", target: repo });

  return NextResponse.json({ ok: true, output });
}
