"use client";

import * as React from "react";

import { Loader2, Search } from "lucide-react";

import { createSupabaseBrowser } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

async function authFetch(path: string, init: RequestInit = {}) {
  const supabase = createSupabaseBrowser();
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return fetch(path, {
    ...init,
    headers: { ...(init.headers || {}), ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(init.body ? { "Content-Type": "application/json" } : {}) },
  });
}

export function Automacoes({ repos }: { repos: string[] }) {
  const [enabled, setEnabled] = React.useState<Set<string>>(new Set());
  const [reviews, setReviews] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [busy, setBusy] = React.useState<string | null>(null);
  const [q, setQ] = React.useState("");
  const [open, setOpen] = React.useState<string | null>(null);

  async function load() {
    const d = await authFetch("/api/gh/automation").then((r) => r.json());
    setEnabled(new Set((d.hooks || []).filter((h: any) => h.active).map((h: any) => h.repo_full_name)));
    setReviews(d.reviews || []);
    setLoading(false);
  }
  React.useEffect(() => { load(); }, []);

  async function toggle(repo: string, on: boolean) {
    setBusy(repo);
    const res = await authFetch("/api/gh/automation", { method: "POST", body: JSON.stringify({ action: on ? "enable" : "disable", repo }) });
    const d = await res.json();
    if (d.ok) {
      setEnabled((prev) => { const n = new Set(prev); on ? n.add(repo) : n.delete(repo); return n; });
    } else {
      alert(d.error === "plan_required" ? "Recurso disponível no plano Starter+." : d.error || "Falha.");
    }
    setBusy(null);
  }

  const filtered = repos.filter((r) => r.toLowerCase().includes(q.trim().toLowerCase()));

  if (loading) return <div className="grid place-items-center py-16"><Loader2 className="size-5 animate-spin text-mute" /></div>;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* repos */}
      <div>
        <h3 className="mb-3 text-[15px] font-bold text-ink">Repositórios</h3>
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-mute" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar repositório…" className="h-10 w-full rounded-sm border border-hairline bg-surface-soft pl-9 pr-3 text-[14px] outline-none focus:border-ink focus:bg-canvas" />
        </div>
        <div className="divide-y divide-hairline rounded-sm border border-hairline">
          {filtered.slice(0, 50).map((r) => {
            const on = enabled.has(r);
            return (
              <div key={r} className="flex items-center gap-2 px-3 py-2.5 text-[14px]">
                <span className="ascii-marker text-ink">[{on ? "+" : "-"}]</span>
                <span className="truncate text-ink">{r}</span>
                <button
                  onClick={() => toggle(r, !on)}
                  disabled={busy === r}
                  className={cn("ml-auto rounded-sm border px-2.5 py-1 text-[12px] font-medium", on ? "border-ink bg-ink text-canvas" : "border-hairline-strong text-mute hover:text-ink")}
                >
                  {busy === r ? "…" : on ? "ativo" : "ativar review"}
                </button>
              </div>
            );
          })}
          {filtered.length === 0 && <p className="px-3 py-6 text-center text-[13px] text-mute">Nenhum repositório.</p>}
        </div>
        <p className="mt-2 text-[12px] text-mute">Ao ativar, instalamos um webhook no repositório. Cada PR aberto/atualizado recebe um review por IA automaticamente.</p>
      </div>

      {/* histórico */}
      <div>
        <h3 className="mb-3 text-[15px] font-bold text-ink">Reviews recentes</h3>
        <div className="divide-y divide-hairline rounded-sm border border-hairline">
          {reviews.length === 0 ? (
            <p className="px-3 py-10 text-center text-[13px] text-mute">Nenhum review automático ainda.</p>
          ) : (
            reviews.map((rv, i) => (
              <div key={i} className="px-3 py-2.5 text-[13px]">
                <div className="flex items-center gap-2">
                  <span className={cn("ascii-marker", rv.status === "done" ? "text-success" : rv.status === "error" ? "text-danger" : "text-warning")}>[{rv.status === "done" ? "+" : rv.status === "error" ? "x" : "-"}]</span>
                  <span className="truncate font-medium text-ink">{rv.repo_full_name} #{rv.pr_number}</span>
                  <span className="ml-auto text-[11px] text-mute">{new Date(rv.created_at).toLocaleDateString("pt-BR")}</span>
                </div>
                {rv.pr_title && <p className="truncate pl-6 text-[12px] text-body">{rv.pr_title}</p>}
                {rv.summary && (
                  <button onClick={() => setOpen(open === `${i}` ? null : `${i}`)} className="pl-6 text-[11px] text-ink underline underline-offset-2">
                    {open === `${i}` ? "ocultar" : "ver review"}
                  </button>
                )}
                {open === `${i}` && rv.summary && (
                  <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap rounded-sm bg-surface-dark p-3 text-[12px] text-canvas/90">{rv.summary}</pre>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
