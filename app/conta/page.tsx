import Link from "next/link";
import { redirect } from "next/navigation";

import { TopReturn } from "@/components/dashboard/top-return";
import { ConnectGitHub } from "@/components/dashboard/connect-github";
import { DisconnectGitHub } from "@/components/dashboard/disconnect-github";
import { Panel, PanelHeader } from "@/components/dashboard/ui";
import { createSupabaseServer } from "@/lib/supabase/server";
import { createAdminClient, getAccessForUser } from "@/lib/saas";

export const dynamic = "force-dynamic";
export const metadata = { title: "Conta" };

export default async function ContaPage() {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/conta");

  const access = await getAccessForUser(user.id, user.email ?? null);
  const admin = createAdminClient();
  const { data: conn } = await admin.from("github_connections").select("github_username,avatar_url,token_type,scopes,connected_at").eq("user_id", user.id).maybeSingle();

  return (
    <div className="min-h-screen">
      <TopReturn />
      <main className="mx-auto max-w-content px-4 py-8">
        <h1 className="text-[24px] font-bold tracking-tight text-ink">Conta</h1>
        <p className="mt-1 text-[14px] text-mute">Perfil, conexão GitHub e plano.</p>

        <div className="mt-6 grid gap-6">
          <Panel>
            <PanelHeader title="Perfil" />
            <div className="space-y-2 p-4 text-[14px]">
              <Row k="E-mail" v={user.email ?? "—"} />
              <Row k="Plano atual" v={<span className="font-bold uppercase">{access.plan_slug}</span>} />
              <Row k="Status" v={access.is_admin ? "administrador" : access.trial_active ? "em teste (Pro)" : access.status} />
            </div>
          </Panel>

          <Panel>
            <PanelHeader title="Conexão GitHub" action={conn ? <DisconnectGitHub /> : undefined} />
            <div className="p-4">
              {conn ? (
                <div className="flex items-center gap-3 text-[14px]">
                  {conn.avatar_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={conn.avatar_url} alt="" className="size-10 rounded-sm border border-hairline" />
                  )}
                  <div>
                    <div className="font-medium text-ink">@{conn.github_username}</div>
                    <div className="text-[12px] text-mute">
                      via {conn.token_type === "oauth" ? "OAuth" : "token"} · escopos: {(conn.scopes || []).join(", ") || "—"}
                    </div>
                  </div>
                </div>
              ) : (
                <ConnectGitHub />
              )}
            </div>
          </Panel>

          <Panel>
            <PanelHeader title="Assinatura" action={<Link href="/assinatura" className="text-[13px] text-ink underline underline-offset-2">gerenciar →</Link>} />
            <div className="p-4 text-[14px] text-mute">
              {access.is_admin ? "Conta de administrador — acesso Enterprise." : access.trial_active ? "Teste Pro ativo." : `Plano ${access.plan_slug}.`}
            </div>
          </Panel>
        </div>
      </main>
    </div>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-hairline py-1.5 last:border-0">
      <span className="text-mute">{k}</span>
      <span className="text-ink">{v}</span>
    </div>
  );
}
