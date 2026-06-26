import { Automacoes } from "@/components/dashboard/automacoes";
import { ConnectGitHub } from "@/components/dashboard/connect-github";
import { PageTitle } from "@/components/dashboard/ui";
import { Upsell } from "@/components/dashboard/upsell";
import { createSupabaseServer } from "@/lib/supabase/server";
import { getAccessForUser } from "@/lib/saas";
import { getUserGitHub } from "@/lib/gh-server";

export const dynamic = "force-dynamic";
export const metadata = { title: "Automações" };

export default async function AutomacoesPage() {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  const access = await getAccessForUser(user!.id, user!.email ?? null);
  const gh = await getUserGitHub(user!.id);

  if (!gh) {
    return (
      <>
        <PageTitle title="Automações" desc="Conecte o GitHub para automatizar reviews." />
        <ConnectGitHub />
      </>
    );
  }
  if (!access.limits.code_review_ai) {
    return (
      <>
        <PageTitle title="PR review automático" desc="Review por IA em cada pull request." />
        <Upsell feature="PR review automático" plan={access.plan_slug} />
      </>
    );
  }

  const repos = (await gh.client.listRepos()).filter((r) => !r.archived).map((r) => r.full_name);

  return (
    <>
      <PageTitle title="Automações" desc="PR review automático por IA — ative por repositório." />
      <Automacoes repos={repos} />
    </>
  );
}
