import { BarRow, Panel, PanelHeader, PageTitle, Stat } from "@/components/dashboard/ui";
import { Sparkline } from "@/components/site/marketing";
import { ConnectGitHub } from "@/components/dashboard/connect-github";
import { Upsell } from "@/components/dashboard/upsell";
import { createSupabaseServer } from "@/lib/supabase/server";
import { getAccessForUser } from "@/lib/saas";
import { getUserGitHub } from "@/lib/gh-server";
import { aggregateRepos } from "@/lib/github";
import { fmtInt } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata = { title: "Analytics" };

export default async function AnalyticsPage() {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  const access = await getAccessForUser(user!.id, user!.email ?? null);
  const gh = await getUserGitHub(user!.id);

  if (!gh) {
    return (
      <>
        <PageTitle title="Analytics" desc="Conecte o GitHub para ver suas métricas." />
        <ConnectGitHub />
      </>
    );
  }
  if (!access.limits.advanced_analytics) {
    return (
      <>
        <PageTitle title="Analytics avançado" desc="Métricas de engenharia detalhadas." />
        <Upsell feature="Analytics avançado" plan={access.plan_slug} />
      </>
    );
  }

  const repos = await gh.client.listRepos();
  const m = aggregateRepos(repos);

  // histograma de atividade por mês (push) — últimos 12 meses
  const now = new Date();
  const months: { label: string; count: number }[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({ label: d.toLocaleDateString("pt-BR", { month: "short" }), count: 0 });
  }
  for (const r of repos) {
    const p = new Date(r.pushed_at);
    const diff = (now.getFullYear() - p.getFullYear()) * 12 + (now.getMonth() - p.getMonth());
    if (diff >= 0 && diff < 12) months[11 - diff].count++;
  }

  // participação de commits (top 3 por estrelas)
  const top = m.byStars.slice(0, 3);
  const participation = await Promise.all(
    top.map(async (r) => ({ name: r.name, stats: await gh.client.participationStats(r.owner.login, r.name) })),
  );

  const maxLang = m.topLanguages[0]?.bytes ?? 1;

  return (
    <>
      <PageTitle title="Analytics avançado" desc="Atividade, linguagens e cadência de commits." />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Repositórios" value={fmtInt(m.totalRepos)} />
        <Stat label="Estrelas" value={fmtInt(m.stars)} />
        <Stat label="Forks" value={fmtInt(m.forksCount)} />
        <Stat label="Repos parados" value={fmtInt(m.staleRepos.length)} sub="> 180 dias sem push" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Panel>
          <PanelHeader title="Atividade (push) por mês" hint="últimos 12 meses" />
          <div className="p-4">
            <Sparkline data={months.map((x) => x.count)} caption={months.map((x) => x.label).join(" · ")} />
            <div className="mt-3 space-y-1">
              {months.slice(-6).map((x) => <BarRow key={x.label} label={x.label} value={x.count} max={Math.max(...months.map((y) => y.count), 1)} suffix={`${x.count}`} />)}
            </div>
          </div>
        </Panel>

        <Panel>
          <PanelHeader title="Linguagens" hint="por bytes" />
          <div className="p-4">
            {m.topLanguages.map((l) => <BarRow key={l.name} label={l.name} value={l.bytes} max={maxLang} suffix={`${l.pct}%`} />)}
          </div>
        </Panel>
      </div>

      <Panel className="mt-6">
        <PanelHeader title="Cadência de commits (top repositórios)" hint="52 semanas via GitHub stats" />
        <div className="space-y-3 p-4">
          {participation.map((p) => (
            <div key={p.name}>
              <div className="mb-1 text-[13px] font-medium text-ink">{p.name}</div>
              <Sparkline data={(p.stats?.all && p.stats.all.length ? p.stats.all : [0]).slice(-26)} />
            </div>
          ))}
          {participation.length === 0 && <p className="text-[14px] text-mute">Sem dados de cadência.</p>}
        </div>
      </Panel>

      <Panel className="mt-6">
        <PanelHeader title="Top por estrelas" />
        <div className="divide-y divide-hairline">
          {m.byStars.map((r) => (
            <a key={r.id} href={r.html_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2.5 text-[14px] hover:bg-surface-soft">
              <span className="ascii-marker text-ink">[+]</span>
              <span className="truncate font-medium text-ink">{r.full_name}</span>
              <span className="ml-auto text-[12px] text-mute">★ {fmtInt(r.stargazers_count)} · ⑂ {fmtInt(r.forks_count)}</span>
            </a>
          ))}
        </div>
      </Panel>
    </>
  );
}
