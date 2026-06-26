"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";

import { CreditCard, Loader2, ShieldCheck } from "lucide-react";

import { TopReturn } from "@/components/dashboard/top-return";
import { CycleToggle, PlanCards, type Plan } from "@/components/site/plan-cards";
import { createSupabaseBrowser } from "@/lib/supabase/client";

async function authFetch(path: string, init: RequestInit = {}) {
  const supabase = createSupabaseBrowser();
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return fetch(path, {
    ...init,
    headers: {
      ...(init.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.body ? { "Content-Type": "application/json" } : {}),
    },
  });
}

function Inner() {
  const params = useSearchParams();
  const [plans, setPlans] = React.useState<Plan[]>([]);
  const [sub, setSub] = React.useState<any>(null);
  const [cycle, setCycle] = React.useState<"month" | "year">("month");
  const [busy, setBusy] = React.useState<string | null>(null);
  const [portalBusy, setPortalBusy] = React.useState(false);
  const [notice, setNotice] = React.useState<string | null>(null);

  async function load() {
    const [p, s] = await Promise.all([
      authFetch("/api/saas/plans").then((r) => r.json()),
      authFetch("/api/saas/subscription").then((r) => r.json()),
    ]);
    setPlans(p.plans || []);
    setSub(s);
  }
  React.useEffect(() => {
    load();
    if (params.get("success")) setNotice("Assinatura confirmada! Obrigado.");
    if (params.get("canceled")) setNotice("Checkout cancelado.");
  }, [params]);

  const isAdmin = sub?.is_admin;
  const currentSlug = isAdmin ? "enterprise" : sub?.plan_slug || "free";
  const status = sub?.subscription?.status;
  const isPaid = !isAdmin && currentSlug !== "free" && status && ["active", "trialing"].includes(status);
  const refundUntil = sub?.subscription?.refund_eligible_until;

  async function subscribe(slug: string) {
    if (slug === "free" || slug === currentSlug) return;
    setBusy(slug);
    try {
      const r = await authFetch("/api/saas/checkout", { method: "POST", body: JSON.stringify({ slug, cycle }) });
      const d = await r.json();
      if (d.url) window.location.href = d.url;
      else { setNotice(d.error || "Erro ao iniciar checkout."); setBusy(null); }
    } catch {
      setNotice("Falha de rede."); setBusy(null);
    }
  }
  async function openPortal() {
    setPortalBusy(true);
    try {
      const r = await authFetch("/api/saas/portal", { method: "POST" });
      const d = await r.json();
      if (d.url) window.location.href = d.url;
      else setNotice("Abra uma assinatura primeiro.");
    } finally {
      setPortalBusy(false);
    }
  }

  return (
    <div className="min-h-screen">
      <TopReturn />
      <main className="mx-auto max-w-frame px-4 py-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-[24px] font-bold tracking-tight text-ink">Assinatura</h1>
            <p className="mt-1 text-[14px] text-mute">
              {isAdmin
                ? "Conta de administrador — acesso Enterprise."
                : sub?.trial_active
                  ? "Teste Pro de 7 dias ativo."
                  : `Plano atual: ${sub?.plan?.name || "Inicial"}.`}
            </p>
          </div>
          {isPaid && (
            <button onClick={openPortal} disabled={portalBusy} className="inline-flex h-9 items-center gap-2 rounded-sm border border-hairline-strong px-4 text-[14px] font-medium text-ink hover:bg-surface-soft">
              {portalBusy ? <Loader2 className="size-4 animate-spin" /> : <CreditCard className="size-4" />} Gerenciar
            </button>
          )}
        </div>

        {notice && <div className="mt-5 rounded-sm border border-hairline-strong bg-surface-soft px-4 py-2 text-[14px] text-charcoal">{notice}</div>}
        {refundUntil && new Date(refundUntil) > new Date() && (
          <div className="mt-5 inline-flex items-center gap-2 rounded-sm border border-success/30 bg-success/5 px-4 py-2 text-[13px] text-charcoal">
            <ShieldCheck className="size-4" /> Reembolso garantido até {new Date(refundUntil).toLocaleDateString("pt-BR")}.
          </div>
        )}

        <div className="mt-8 flex justify-center">
          <CycleToggle cycle={cycle} setCycle={setCycle} />
        </div>
        <div className="mt-8">
          <PlanCards
            plans={plans}
            cycle={cycle}
            currentSlug={currentSlug}
            onSelect={subscribe}
            busy={busy}
            ctaLabel={(p) => (p.slug === "free" ? "Grátis" : currentSlug === p.slug ? "Plano atual" : "Assinar")}
          />
        </div>
        <p className="mt-8 text-center text-[12px] text-mute">
          Pagamento seguro via Stripe · 7 dias de Pro grátis · reembolso de 7 dias · sem cobrança por GB
        </p>
      </main>
    </div>
  );
}

export default function AssinaturaPage() {
  return (
    <React.Suspense fallback={<div className="grid min-h-screen place-items-center"><Loader2 className="size-5 animate-spin text-mute" /></div>}>
      <Inner />
    </React.Suspense>
  );
}
