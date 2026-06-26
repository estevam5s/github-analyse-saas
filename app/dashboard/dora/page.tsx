import { ConnectGitHub } from "@/components/dashboard/connect-github";
import { DoraView } from "@/components/dashboard/dora-view";
import { PageTitle } from "@/components/dashboard/ui";
import { Upsell } from "@/components/dashboard/upsell";
import { createSupabaseServer } from "@/lib/supabase/server";
import { getAccessForUser } from "@/lib/saas";
import { getUserGitHub } from "@/lib/gh-server";
import { computeDora, overallRating } from "@/lib/dora";

export const dynamic = "force-dynamic";
export const metadata = { title: "DORA" };

export default async function DoraPage({ searchParams }: { searchParams: Promise<{ repo?: string }> }) {
  const { repo: repoParam } = await searchParams;
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  const access = await getAccessForUser(user!.id, user!.email ?? null);
  const gh = await getUserGitHub(user!.id);

  if (!gh) {
    return (
      <>
        <PageTitle title="Métricas DORA" desc="Conecte o GitHub para medir entrega de software." />
        <ConnectGitHub />
      </>
    );
  }
  if (!access.limits.advanced_analytics) {
    return (
      <>
        <PageTitle title="Métricas DORA" desc="Deploy frequency, lead time, change failure rate e MTTR." />
        <Upsell feature="Métricas DORA" plan={access.plan_slug} />
      </>
    );
  }

  const repos = await gh.client.listRepos();
  const ownRepos = repos.filter((r) => !r.fork);
  const list = (ownRepos.length ? ownRepos : repos).sort((a, b) => new Date(b.pushed_at).getTime() - new Date(a.pushed_at).getTime());
  const selected = repoParam && list.find((r) => r.full_name === repoParam) ? repoParam : list[0]?.full_name;

  if (!selected) {
    return (
      <>
        <PageTitle title="Métricas DORA" desc="Entrega de software com base nos 4 indicadores DORA." />
        <p className="text-[14px] text-mute">Nenhum repositório disponível.</p>
      </>
    );
  }

  const [owner, name] = selected.split("/");
  const repoInfo = list.find((r) => r.full_name === selected)!;
  const windowDays = Math.min(90, access.limits.history_days === -1 ? 90 : access.limits.history_days);

  const [pulls, releases, runsRes] = await Promise.all([
    gh.client.pulls(owner, name, "all"),
    gh.client.releases(owner, name),
    gh.client.workflowRunsList(owner, name, repoInfo.default_branch),
  ]);

  const { metrics, period } = computeDora({
    windowDays,
    mergedPRs: (pulls as any[]).map((p) => ({ created_at: p.created_at, merged_at: p.merged_at, base: p.base })),
    releases: (releases as any[]).map((r) => ({ published_at: r.published_at })),
    runs: ((runsRes?.workflow_runs as any[]) ?? []).map((r) => ({ created_at: r.created_at, updated_at: r.updated_at, conclusion: r.conclusion, head_branch: r.head_branch })),
    defaultBranch: repoInfo.default_branch,
  });

  return (
    <>
      <PageTitle title="Métricas DORA" desc="Os 4 indicadores-chave de entrega de software, calculados do seu GitHub." />
      <DoraView repos={list.map((r) => r.full_name)} repo={selected} metrics={metrics} overall={overallRating(metrics)} period={period} />
    </>
  );
}
