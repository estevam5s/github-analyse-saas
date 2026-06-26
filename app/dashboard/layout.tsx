import Link from "next/link";
import { redirect } from "next/navigation";

import { Sidebar } from "@/components/dashboard/sidebar";
import { createSupabaseServer } from "@/lib/supabase/server";
import { getAccessForUser } from "@/lib/saas";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/dashboard");

  const access = await getAccessForUser(user.id, user.email ?? null);

  const trialDaysLeft = access.trial_ends_at
    ? Math.max(0, Math.ceil((new Date(access.trial_ends_at).getTime() - Date.now()) / 86_400_000))
    : 0;

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <Sidebar plan={access.plan_slug} isAdmin={access.is_admin} />

      <div className="flex-1">
        {/* banner de trial / bloqueio */}
        {access.trial_active && (
          <div className="border-b border-hairline bg-surface-card px-4 py-2 text-center text-[13px] text-charcoal">
            <span className="ascii-marker text-ink">[!]</span> Teste Pro ativo — {trialDaysLeft} dia(s) restante(s).{" "}
            <Link href="/assinatura" className="font-medium text-ink underline underline-offset-2">
              Escolher um plano
            </Link>
          </div>
        )}
        {access.blocked && (
          <div className="border-b border-danger/30 bg-danger/5 px-4 py-2 text-center text-[13px] text-danger">
            <span className="ascii-marker">[x]</span> Seu teste expirou. Recursos premium estão bloqueados.{" "}
            <Link href="/assinatura" className="font-medium underline underline-offset-2">
              Assinar agora
            </Link>
          </div>
        )}

        <main className="mx-auto max-w-frame px-4 py-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
