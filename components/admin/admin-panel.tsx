"use client";

import * as React from "react";

import { Loader2 } from "lucide-react";

import { createSupabaseBrowser } from "@/lib/supabase/client";
import { brl, fmtInt } from "@/lib/utils";
import { cn } from "@/lib/utils";

async function api(method: "GET" | "POST", q: string, body?: any) {
  const supabase = createSupabaseBrowser();
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  const res = await fetch(`/api/saas/admin${q}`, {
    method,
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(body ? { "Content-Type": "application/json" } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  return res.json();
}

const TABS: [string, string][] = [
  ["overview", "Visão geral"], ["users", "Usuários"], ["plans", "Planos"], ["subscriptions", "Assinaturas"],
  ["payments", "Pagamentos"], ["ai", "IA"], ["analytics", "Analytics"], ["logs", "Logs"],
  ["monitoring", "Monitoramento"], ["products", "Produtos"], ["promotions", "Promoções"],
  ["seo", "SEO"], ["flags", "Feature flags"], ["support", "Suporte"], ["visitors", "Visitantes"],
  ["keys", "API keys"], ["backup", "Backup"],
];

export function AdminPanel() {
  const [tab, setTab] = React.useState("overview");
  const [data, setData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [toast, setToast] = React.useState<string | null>(null);

  const fetchTab = React.useCallback(async (t: string) => {
    setLoading(true);
    const mod = t === "analytics" ? "overview" : t;
    const d = await api("GET", `?module=${mod}`);
    setData(d);
    setLoading(false);
  }, []);

  React.useEffect(() => { fetchTab(tab); }, [tab, fetchTab]);

  async function act(body: any) {
    const d = await api("POST", "", body);
    if (d.ok) { setToast("Ação concluída."); fetchTab(tab); if (d.key) alert(`API key (copie agora):\n\n${d.key}`); }
    else setToast(d.error || "Falha.");
    setTimeout(() => setToast(null), 3000);
  }

  return (
    <div className="mx-auto max-w-frame px-4 py-6">
      <h1 className="text-[24px] font-bold tracking-tight text-ink">Painel administrativo</h1>
      <p className="mt-1 text-[14px] text-mute">Gestão completa do ecossistema SaaS.</p>

      {/* tabs */}
      <div className="mt-5 flex flex-wrap gap-1 border-b border-hairline">
        {TABS.map(([k, label]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={cn(
              "px-3 py-2 text-[13px] font-medium",
              tab === k ? "border-b-2 border-ink text-ink" : "text-mute hover:text-ink",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {toast && <div className="mt-4 rounded-sm border border-hairline-strong bg-surface-soft px-3 py-2 text-[13px] text-charcoal">{toast}</div>}

      <div className="mt-6">
        {loading ? (
          <div className="grid place-items-center py-20"><Loader2 className="size-5 animate-spin text-mute" /></div>
        ) : (
          <Module tab={tab} data={data} act={act} />
        )}
      </div>
    </div>
  );
}

/* ───────────────────────── render por módulo ───────────────────────── */

function Module({ tab, data, act }: { tab: string; data: any; act: (b: any) => void }) {
  if (tab === "overview" || tab === "analytics") {
    const o = data?.overview ?? {};
    const dist = data?.planDistribution ?? {};
    const cards = [
      ["Usuários", fmtInt(o.total_users)], ["Em teste", fmtInt(o.trial_users)],
      ["Pagantes", fmtInt(o.paying_users)], ["Cancelados", fmtInt(o.canceled_users)],
      ["Repositórios", fmtInt(o.total_repos)], ["Ações de IA", fmtInt(o.total_ai_jobs)],
      ["Receita", brl(o.total_revenue_cents || 0)],
    ];
    return (
      <>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          {cards.map(([l, v]) => (
            <div key={l} className="rounded-sm border border-hairline p-4">
              <div className="text-[12px] uppercase text-mute">{l}</div>
              <div className="mt-1 text-[22px] font-bold tabular-nums text-ink">{v}</div>
            </div>
          ))}
        </div>
        <div className="mt-6 rounded-sm border border-hairline p-4">
          <div className="mb-2 text-[14px] font-bold text-ink">Distribuição por plano</div>
          {Object.entries(dist).map(([k, v]) => (
            <div key={k} className="flex items-center justify-between border-b border-hairline py-1.5 text-[14px] last:border-0">
              <span className="uppercase text-charcoal">{k}</span><span className="tabular-nums text-ink">{fmtInt(v as number)}</span>
            </div>
          ))}
        </div>
      </>
    );
  }

  if (tab === "users") {
    return (
      <Table head={["E-mail", "Plano", "Status", "GitHub", "Ações"]}>
        {(data?.users ?? []).map((u: any) => (
          <tr key={u.id} className="border-b border-hairline">
            <Td>{u.email}{u.role === "admin" && <span className="ml-1 text-[11px] text-accent">admin</span>}</Td>
            <Td>
              <select defaultValue={u.plan_slug} onChange={(e) => act({ action: "user.update", user_id: u.id, plan_slug: e.target.value })} className="rounded-sm border border-hairline bg-surface-soft px-1 py-0.5 text-[12px]">
                {["free", "starter", "pro", "team", "enterprise"].map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </Td>
            <Td>{u.blocked ? <span className="text-danger">bloqueado</span> : u.sub?.status || "—"}</Td>
            <Td>{u.github_username ? `@${u.github_username}` : "—"}</Td>
            <Td>
              <div className="flex gap-2">
                <button onClick={() => act({ action: "user.update", user_id: u.id, blocked: !u.blocked })} className="text-[12px] text-mute hover:text-ink">{u.blocked ? "desbloquear" : "bloquear"}</button>
                <button onClick={() => confirm(`Excluir ${u.email}?`) && act({ action: "user.delete", user_id: u.id })} className="text-[12px] text-danger hover:underline">excluir</button>
              </div>
            </Td>
          </tr>
        ))}
      </Table>
    );
  }

  if (tab === "plans") {
    return (
      <Table head={["Slug", "Nome", "Mensal", "Anual", "Destaque", ""]}>
        {(data?.plans ?? []).map((p: any) => (
          <tr key={p.slug} className="border-b border-hairline">
            <Td>{p.slug}</Td><Td>{p.name}</Td>
            <Td><PriceEdit value={p.price_month} onSave={(v) => act({ action: "plan.update", slug: p.slug, price_month: v })} /></Td>
            <Td><PriceEdit value={p.price_year} onSave={(v) => act({ action: "plan.update", slug: p.slug, price_year: v })} /></Td>
            <Td><input type="checkbox" defaultChecked={p.highlighted} onChange={(e) => act({ action: "plan.update", slug: p.slug, highlighted: e.target.checked })} className="size-4 accent-ink" /></Td>
            <Td />
          </tr>
        ))}
      </Table>
    );
  }

  if (tab === "subscriptions")
    return <Table head={["Usuário", "Plano", "Status", "Ciclo", "Fim período"]}>
      {(data?.subscriptions ?? []).map((s: any) => (
        <tr key={s.id} className="border-b border-hairline"><Td mono>{s.user_id.slice(0, 8)}</Td><Td>{s.plan_slug}</Td><Td>{s.status}</Td><Td>{s.cycle}</Td><Td>{s.current_period_end ? new Date(s.current_period_end).toLocaleDateString("pt-BR") : "—"}</Td></tr>
      ))}
    </Table>;

  if (tab === "payments")
    return <Table head={["Evento", "Tipo", "Data"]}>
      {(data?.payments ?? []).map((p: any) => (<tr key={p.id} className="border-b border-hairline"><Td mono>{p.event_id?.slice(0, 18)}</Td><Td>{p.type}</Td><Td>{new Date(p.created_at).toLocaleString("pt-BR")}</Td></tr>))}
    </Table>;

  if (tab === "ai")
    return <>
      <p className="mb-3 text-[14px] text-mute">Total de execuções: <b className="text-ink">{fmtInt(data?.total)}</b></p>
      <Table head={["Tipo", "Repositório", "Usuário", "Data"]}>
        {(data?.jobs ?? []).map((j: any) => (<tr key={j.id} className="border-b border-hairline"><Td>{j.kind}</Td><Td>{j.repo_full_name || "—"}</Td><Td mono>{j.user_id.slice(0, 8)}</Td><Td>{new Date(j.created_at).toLocaleString("pt-BR")}</Td></tr>))}
      </Table>
    </>;

  if (tab === "logs")
    return <Table head={["Nível", "Ação", "Alvo", "Ator", "Data"]}>
      {(data?.logs ?? []).map((l: any) => (<tr key={l.id} className="border-b border-hairline"><Td><Lvl v={l.level} /></Td><Td>{l.action}</Td><Td>{l.target || "—"}</Td><Td>{l.actor || "—"}</Td><Td>{new Date(l.created_at).toLocaleString("pt-BR")}</Td></tr>))}
    </Table>;

  if (tab === "monitoring")
    return <>
      <button onClick={() => act({ action: "service.heartbeat" })} className="mb-4 rounded-sm bg-ink px-3 py-1.5 text-[13px] font-medium text-canvas hover:bg-ink-deep">Rodar heartbeat</button>
      <Table head={["Serviço", "Status", "Latência", "Uptime", "Verificado"]}>
        {(data?.services ?? []).map((s: any) => (<tr key={s.service} className="border-b border-hairline"><Td>{s.service}</Td><Td><span className={s.status === "operational" ? "text-success" : "text-danger"}>{s.status}</span></Td><Td>{s.latency_ms}ms</Td><Td>{s.uptime}%</Td><Td>{new Date(s.checked_at).toLocaleString("pt-BR")}</Td></tr>))}
      </Table>
    </>;

  if (tab === "products")
    return <Table head={["Slug", "Nome", "Categoria", "Status", "Mensal"]}>
      {(data?.products ?? []).map((p: any) => (<tr key={p.id} className="border-b border-hairline"><Td>{p.slug}</Td><Td>{p.name}</Td><Td>{p.category}</Td><Td>{p.status}</Td><Td>{brl(p.price_month)}</Td></tr>))}
    </Table>;

  if (tab === "promotions")
    return <>
      <PromoForm act={act} />
      <Table head={["Código", "Tipo", "Valor", "Stripe", "Ativo"]}>
        {(data?.promotions ?? []).map((p: any) => (<tr key={p.id} className="border-b border-hairline"><Td>{p.code}</Td><Td>{p.kind}</Td><Td>{p.value}</Td><Td mono>{p.stripe_coupon || "—"}</Td><Td>{p.active ? "sim" : "não"}</Td></tr>))}
      </Table>
    </>;

  if (tab === "seo") return <SeoForm seo={data?.seo} act={act} />;

  if (tab === "flags")
    return <Table head={["Chave", "Descrição", "Ativo"]}>
      {(data?.flags ?? []).map((f: any) => (<tr key={f.key} className="border-b border-hairline"><Td>{f.key}</Td><Td>{f.description}</Td><Td><input type="checkbox" defaultChecked={f.enabled} onChange={(e) => act({ action: "flag.toggle", key: f.key, enabled: e.target.checked })} className="size-4 accent-ink" /></Td></tr>))}
    </Table>;

  if (tab === "support")
    return <Table head={["Assunto", "E-mail", "Status", "Data"]}>
      {(data?.tickets ?? []).length === 0 ? <tr><Td>Nenhum ticket.</Td></tr> : (data?.tickets ?? []).map((t: any) => (<tr key={t.id} className="border-b border-hairline"><Td>{t.subject}</Td><Td>{t.email}</Td><Td>{t.status}</Td><Td>{new Date(t.created_at).toLocaleString("pt-BR")}</Td></tr>))}
    </Table>;

  if (tab === "visitors")
    return <div className="grid gap-4 sm:grid-cols-3">
      <AggBox title={`Países (${fmtInt(data?.total)} acessos)`} rows={data?.byCountry} />
      <AggBox title="Dispositivos" rows={data?.byDevice} />
      <AggBox title="Navegadores" rows={data?.byBrowser} />
    </div>;

  if (tab === "keys")
    return <>
      <button onClick={() => { const name = prompt("Nome da chave:"); if (name) act({ action: "key.create", name }); }} className="mb-4 rounded-sm bg-ink px-3 py-1.5 text-[13px] font-medium text-canvas hover:bg-ink-deep">Gerar API key</button>
      <Table head={["Nome", "Prefixo", "Escopos", "Ativo", ""]}>
        {(data?.keys ?? []).map((k: any) => (<tr key={k.id} className="border-b border-hairline"><Td>{k.name}</Td><Td mono>{k.prefix}…</Td><Td>{(k.scopes || []).join(", ")}</Td><Td>{k.active ? "sim" : "não"}</Td><Td>{k.active && <button onClick={() => act({ action: "key.revoke", id: k.id })} className="text-[12px] text-danger hover:underline">revogar</button>}</Td></tr>))}
      </Table>
    </>;

  if (tab === "backup")
    return <>
      <button onClick={async () => {
        const supabase = createSupabaseBrowser();
        const { data: s } = await supabase.auth.getSession();
        const res = await fetch("/api/saas/admin", { method: "POST", headers: { Authorization: `Bearer ${s.session?.access_token}`, "Content-Type": "application/json" }, body: JSON.stringify({ action: "backup.create" }) });
        const d = await res.json();
        if (d.backup) { const blob = new Blob([JSON.stringify(d.backup, null, 2)], { type: "application/json" }); const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `backup-${new Date().toISOString().slice(0, 10)}.json`; a.click(); }
      }} className="mb-4 rounded-sm bg-ink px-3 py-1.5 text-[13px] font-medium text-canvas hover:bg-ink-deep">Gerar e baixar backup</button>
      <Table head={["Tipo", "Tabelas", "Tamanho", "Nota", "Data"]}>
        {(data?.backups ?? []).map((b: any) => (<tr key={b.id} className="border-b border-hairline"><Td>{b.kind}</Td><Td>{b.tables_count}</Td><Td>{(b.size_bytes / 1024).toFixed(1)} KB</Td><Td>{b.note}</Td><Td>{new Date(b.created_at).toLocaleString("pt-BR")}</Td></tr>))}
      </Table>
    </>;

  return <p className="text-[14px] text-mute">Módulo não encontrado.</p>;
}

/* ───────────────────────── helpers de UI ───────────────────────── */
function Table({ head, children }: { head: string[]; children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-sm border border-hairline">
      <table className="w-full text-left text-[13px]">
        <thead><tr className="border-b border-hairline bg-surface-soft">{head.map((h) => <th key={h} className="px-3 py-2 font-bold text-charcoal">{h}</th>)}</tr></thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}
function Td({ children, mono }: { children?: React.ReactNode; mono?: boolean }) {
  return <td className={cn("px-3 py-2 text-ink", mono && "text-[12px] text-mute")}>{children}</td>;
}
function Lvl({ v }: { v: string }) {
  const c = v === "error" || v === "security" ? "text-danger" : v === "warn" ? "text-warning" : "text-mute";
  return <span className={c}>{v}</span>;
}
function AggBox({ title, rows }: { title: string; rows?: [string, number][] }) {
  return (
    <div className="rounded-sm border border-hairline p-4">
      <div className="mb-2 text-[14px] font-bold text-ink">{title}</div>
      {(rows ?? []).length === 0 ? <p className="text-[13px] text-mute">Sem dados.</p> : (rows ?? []).map(([k, v]) => (
        <div key={k} className="flex justify-between border-b border-hairline py-1 text-[13px] last:border-0"><span className="text-charcoal">{k}</span><span className="tabular-nums text-ink">{v}</span></div>
      ))}
    </div>
  );
}
function PriceEdit({ value, onSave }: { value: number; onSave: (v: number) => void }) {
  const [v, setV] = React.useState(value);
  return (
    <span className="inline-flex items-center gap-1">
      <input type="number" value={v} onChange={(e) => setV(Number(e.target.value))} className="w-20 rounded-sm border border-hairline bg-surface-soft px-1 py-0.5 text-[12px]" />
      {v !== value && <button onClick={() => onSave(v)} className="text-[11px] text-accent hover:underline">salvar</button>}
    </span>
  );
}
function PromoForm({ act }: { act: (b: any) => void }) {
  const [code, setCode] = React.useState(""); const [kind, setKind] = React.useState("percent"); const [value, setValue] = React.useState(10); const [stripe, setStripe] = React.useState(false);
  return (
    <div className="mb-4 flex flex-wrap items-end gap-2 rounded-sm border border-hairline p-3">
      <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="CÓDIGO" className="h-9 rounded-sm border border-hairline bg-surface-soft px-2 text-[13px]" />
      <select value={kind} onChange={(e) => setKind(e.target.value)} className="h-9 rounded-sm border border-hairline bg-surface-soft px-2 text-[13px]"><option value="percent">%</option><option value="fixed">R$</option></select>
      <input type="number" value={value} onChange={(e) => setValue(Number(e.target.value))} className="h-9 w-20 rounded-sm border border-hairline bg-surface-soft px-2 text-[13px]" />
      <label className="flex items-center gap-1 text-[12px] text-body"><input type="checkbox" checked={stripe} onChange={(e) => setStripe(e.target.checked)} className="size-4 accent-ink" /> cupom Stripe</label>
      <button onClick={() => code && act({ action: "promotion.create", code, kind, value, use_stripe: stripe })} className="h-9 rounded-sm bg-ink px-3 text-[13px] font-medium text-canvas hover:bg-ink-deep">Criar</button>
    </div>
  );
}
function SeoForm({ seo, act }: { seo: any; act: (b: any) => void }) {
  const [f, setF] = React.useState({ meta_title: seo?.meta_title || "", meta_description: seo?.meta_description || "", robots: seo?.robots || "index,follow", ga_id: seo?.ga_id || "", gtm_id: seo?.gtm_id || "" });
  const set = (k: string, v: string) => setF((p) => ({ ...p, [k]: v }));
  return (
    <div className="max-w-xl space-y-3 rounded-sm border border-hairline p-4">
      {[["meta_title", "Meta title"], ["meta_description", "Meta description"], ["robots", "Robots"], ["ga_id", "Google Analytics ID"], ["gtm_id", "GTM ID"]].map(([k, label]) => (
        <div key={k} className="space-y-1">
          <label className="text-[12px] uppercase text-mute">{label}</label>
          <input value={(f as any)[k]} onChange={(e) => set(k, e.target.value)} className="h-9 w-full rounded-sm border border-hairline bg-surface-soft px-2 text-[13px]" />
        </div>
      ))}
      <button onClick={() => act({ action: "seo.update", ...f })} className="rounded-sm bg-ink px-3 py-1.5 text-[13px] font-medium text-canvas hover:bg-ink-deep">Salvar SEO</button>
    </div>
  );
}
