import { ConnectGitHub } from "@/components/dashboard/connect-github";
import { OrgManage } from "@/components/dashboard/org-manage";
import { Panel, PanelHeader, PageTitle } from "@/components/dashboard/ui";
import { Upsell } from "@/components/dashboard/upsell";
import { createSupabaseServer } from "@/lib/supabase/server";
import { getAccessForUser } from "@/lib/saas";
import { getUserGitHub } from "@/lib/gh-server";
import { fmtInt } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata = { title: "Organização" };

export default async function OrgPage() {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  const access = await getAccessForUser(user!.id, user!.email ?? null);
  const gh = await getUserGitHub(user!.id);

  if (!gh) {
    return (
      <>
        <PageTitle title="Organização" desc="Conecte o GitHub para gerir repositórios." />
        <ConnectGitHub />
      </>
    );
  }
  if (!access.limits.org_management) {
    return (
      <>
        <PageTitle title="Gestão de organização" desc="Crie issues, repositórios e gerencie." />
        <Upsell feature="Gestão de organização" plan={access.plan_slug} />
      </>
    );
  }

  const repos = await gh.client.listRepos();
  const byOwner = new Map<string, { count: number; stars: number }>();
  for (const r of repos) {
    const o = r.owner.login;
    const cur = byOwner.get(o) ?? { count: 0, stars: 0 };
    cur.count++; cur.stars += r.stargazers_count;
    byOwner.set(o, cur);
  }
  const owners = [...byOwner.entries()].sort((a, b) => b[1].count - a[1].count);

  return (
    <>
      <PageTitle title="Gestão de organização" desc="Owners, repositórios e ações diretas no GitHub." />

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel>
          <PanelHeader title="Owners & organizações" hint={`${owners.length} contas`} />
          <div className="divide-y divide-hairline">
            {owners.map(([owner, s]) => (
              <a key={owner} href={`https://github.com/${owner}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2.5 text-[14px] hover:bg-surface-soft">
                <span className="ascii-marker text-ink">[+]</span>
                <span className="font-medium text-ink">{owner}</span>
                <span className="ml-auto text-[12px] text-mute">{fmtInt(s.count)} repos · ★ {fmtInt(s.stars)}</span>
              </a>
            ))}
          </div>
        </Panel>

        <div>
          <h3 className="mb-3 text-[15px] font-bold text-ink">Ações rápidas</h3>
          <OrgManage repos={repos.map((r) => r.full_name)} />
        </div>
      </div>
    </>
  );
}
