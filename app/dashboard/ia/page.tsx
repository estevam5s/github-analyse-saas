import { AiConsole } from "@/components/dashboard/ai-console";
import { ConnectGitHub } from "@/components/dashboard/connect-github";
import { PageTitle } from "@/components/dashboard/ui";
import { createSupabaseServer } from "@/lib/supabase/server";
import { getAccessForUser } from "@/lib/saas";
import { getUserGitHub } from "@/lib/gh-server";

export const dynamic = "force-dynamic";
export const metadata = { title: "Inteligência IA" };

export default async function AiPage() {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  const access = await getAccessForUser(user!.id, user!.email ?? null);
  const gh = await getUserGitHub(user!.id);

  if (!gh) {
    return (
      <>
        <PageTitle title="Inteligência IA" desc="Conecte o GitHub para analisar seu código." />
        <ConnectGitHub />
      </>
    );
  }

  const repos = (await gh.client.listRepos()).map((r) => r.full_name);

  return (
    <>
      <PageTitle title="Inteligência IA" desc="Code review, README, arquitetura, qualidade e vulnerabilidades — por IA." />
      <AiConsole repos={repos} limits={access.limits} />
    </>
  );
}
