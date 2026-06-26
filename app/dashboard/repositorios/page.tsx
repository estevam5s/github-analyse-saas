import { ConnectGitHub } from "@/components/dashboard/connect-github";
import { RepoList } from "@/components/dashboard/repo-list";
import { PageTitle } from "@/components/dashboard/ui";
import { createSupabaseServer } from "@/lib/supabase/server";
import { getUserGitHub } from "@/lib/gh-server";

export const dynamic = "force-dynamic";
export const metadata = { title: "Repositórios" };

export default async function ReposPage() {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  const gh = await getUserGitHub(user!.id);

  if (!gh) {
    return (
      <>
        <PageTitle title="Repositórios" desc="Conecte o GitHub para listar seus repositórios." />
        <ConnectGitHub />
      </>
    );
  }

  const repos = await gh.client.listRepos();

  return (
    <>
      <PageTitle title="Repositórios" desc="Busque, filtre e abra qualquer repositório." />
      <RepoList repos={repos} />
    </>
  );
}
