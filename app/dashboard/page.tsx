import Link from "next/link";

import { BarRow, Empty, Panel, PanelHeader, PageTitle, Stat } from "@/components/dashboard/ui";
import { ConnectGitHub } from "@/components/dashboard/connect-github";
import { createSupabaseServer } from "@/lib/supabase/server";
import { getAccessForUser } from "@/lib/saas";
import { getAiUsageThisMonth, getUserGitHub } from "@/lib/gh-server";
import { aggregateRepos } from "@/lib/github";
import { fmtInt } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata = { title: "Visão geral" };

export default async function DashboardOverview() {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  const access = await getAccessForUser(user!.id, user!.email ?? null);
  const gh = await getUserGitHub(user!.id);

  if (!gh) {
    return (
      <>
        <PageTitle title="Visão geral" desc="Conecte sua conta para começar a medir." />
        <ConnectGitHub />
      </>
    );
  }

  const repos = await gh.client.listRepos();
  const m = aggregateRepos(repos);
  const aiUsed = await getAiUsageThisMonth(user!.id);
  const aiLimit = access.limits.ai_per_month;
  const repoLimit = access.limits.repos;

  const maxLangBytes = m.topLanguages[0]?.bytes ?? 1;

  return (
    <>
      <PageTitle title={`Olá, @${gh.username ?? "dev"}`} desc="Resumo dos seus repositórios e atividade.">
        <Link href="/dashboard/ia" className="inline-flex h-9 items-center rounded-sm bg-ink px-4 text-[14px] font-medium text-canvas hover:bg-ink-deep">
          Analisar com IA
        </Link>
      </PageTitle>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Repositórios" value={fmtInt(m.totalRepos)} sub={`${m.publicRepos} públicos · ${m.privateRepos} privados`} />
        <Stat label="Estrelas" value={fmtInt(m.stars)} sub={`${fmtInt(m.forksCount)} forks`} />
        <Stat label="Issues abertas" value={fmtInt(m.openIssues)} sub={`${m.archived} arquivados`} />
        <Stat label="IA no mês" value={aiLimit === -1 ? fmtInt(aiUsed) : `${fmtInt(aiUsed)}/${fmtInt(aiLimit)}`} sub="ações usadas" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Linguagens */}
        <Panel>
          <PanelHeader title="Linguagens" hint="distribuição por bytes" />
          <div className="p-4">
            {m.topLanguages.length === 0 ? (
              <p className="text-[14px] text-mute">Sem dados de linguagem.</p>
            ) : (
              m.topLanguages.map((l) => <BarRow key={l.name} label={l.name} value={l.bytes} max={maxLangBytes} suffix={`${l.pct}%`} />)
            )}
          </div>
        </Panel>

        {/* Uso & plano */}
        <Panel>
          <PanelHeader title="Plano & limites" hint={`plano ${access.plan_slug}`} />
          <div className="space-y-1 p-4">
            <BarRow label="Repositórios" value={Math.min(m.totalRepos, repoLimit === -1 ? m.totalRepos : repoLimit)} max={repoLimit === -1 ? m.totalRepos : repoLimit} suffix={repoLimit === -1 ? "∞" : `${m.totalRepos}/${repoLimit}`} />
            <BarRow label="IA / mês" value={aiUsed} max={aiLimit === -1 ? Math.max(aiUsed, 1) : aiLimit} suffix={aiLimit === -1 ? "∞" : `${aiUsed}/${aiLimit}`} />
            <div className="mt-3 flex flex-wrap gap-2 text-[12px]">
              {feature("Analytics avançado", access.limits.advanced_analytics)}
              {feature("Code review IA", access.limits.code_review_ai)}
              {feature("Vulnerabilidades", access.limits.vuln_scan)}
              {feature("Gestão de org", access.limits.org_management)}
              {feature("API", access.limits.api_access)}
            </div>
            {!access.is_admin && (
              <Link href="/assinatura" className="mt-3 inline-block text-[13px] font-medium text-ink underline underline-offset-2">
                Ver planos →
              </Link>
            )}
          </div>
        </Panel>
      </div>

      {/* Repositórios recentes */}
      <Panel className="mt-6">
        <PanelHeader title="Atividade recente" action={<Link href="/dashboard/repositorios" className="text-[13px] text-mute hover:text-ink">ver todos →</Link>} />
        <div className="divide-y divide-hairline">
          {m.recentlyActive.length === 0 ? (
            <div className="p-4"><Empty title="Nenhum repositório encontrado" hint="Verifique as permissões do token." /></div>
          ) : (
            m.recentlyActive.map((r) => (
              <a key={r.id} href={r.html_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-4 py-2.5 text-[14px] hover:bg-surface-soft">
                <span className="ascii-marker text-ink">[+]</span>
                <span className="truncate font-medium text-ink">{r.name}</span>
                {r.private && <span className="rounded-sm border border-hairline-strong px-1.5 text-[11px] text-mute">privado</span>}
                <span className="ml-auto flex shrink-0 items-center gap-3 text-[12px] text-mute">
                  {r.language && <span>{r.language}</span>}
                  <span>★ {fmtInt(r.stargazers_count)}</span>
                  <span>{new Date(r.pushed_at).toLocaleDateString("pt-BR")}</span>
                </span>
              </a>
            ))
          )}
        </div>
      </Panel>
    </>
  );
}

function feature(label: string, on: boolean) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-sm border px-2 py-0.5 ${on ? "border-hairline-strong text-ink" : "border-hairline text-ash line-through"}`}>
      [{on ? "+" : "-"}] {label}
    </span>
  );
}
