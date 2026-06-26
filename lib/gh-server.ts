import { createAdminClient } from "@/lib/saas";
import { GitHubClient } from "@/lib/github";

/** Recupera o token GitHub salvo (OAuth ou PAT) e devolve um client pronto. */
export async function getUserGitHub(userId: string): Promise<{ client: GitHubClient; username: string | null } | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("github_connections")
    .select("access_token,github_username")
    .eq("user_id", userId)
    .maybeSingle();
  if (!data?.access_token) return null;
  return { client: new GitHubClient(data.access_token), username: data.github_username ?? null };
}

/** Uso de IA no período atual (yyyy-mm). */
export async function getAiUsageThisMonth(userId: string): Promise<number> {
  const admin = createAdminClient();
  const period = new Date().toISOString().slice(0, 7);
  const { data } = await admin
    .from("app_usage")
    .select("count")
    .eq("user_id", userId)
    .eq("kind", "ai")
    .eq("period", period)
    .maybeSingle();
  return data?.count ?? 0;
}
