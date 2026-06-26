"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { Loader2, Sparkles } from "lucide-react";

import type { Metric, Rating } from "@/lib/dora";
import { createSupabaseBrowser } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const RATING_STYLE: Record<Rating, string> = {
  Elite: "text-success border-success/40",
  Alto: "text-accent border-accent/40",
  "Médio": "text-warning border-warning/40",
  "Baixo": "text-danger border-danger/40",
  "—": "text-ash border-hairline",
};

export function DoraView({
  repos,
  repo,
  metrics,
  overall,
  period,
}: {
  repos: string[];
  repo: string;
  metrics: Metric[];
  overall: Rating;
  period: string;
}) {
  const router = useRouter();
  const [insight, setInsight] = React.useState<string>("");
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);

  async function runInsight() {
    setBusy(true);
    setErr(null);
    const supabase = createSupabaseBrowser();
    const { data } = await supabase.auth.getSession();
    const res = await fetch("/api/ai/insight", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(data.session ? { Authorization: `Bearer ${data.session.access_token}` } : {}) },
      body: JSON.stringify({ repo, metrics: metrics.map((m) => ({ label: m.label, value: m.value, rating: m.rating })) }),
    });
    const d = await res.json();
    if (d.ok) setInsight(d.output);
    else setErr(d.error === "ai_limit" ? "Cota de IA do mês atingida." : d.error === "plan_required" ? "Recurso do plano Starter+." : "Falha.");
    setBusy(false);
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-[13px] text-mute">repositório:</span>
          <select
            value={repo}
            onChange={(e) => router.push(`/dashboard/dora?repo=${encodeURIComponent(e.target.value)}`)}
            className="h-9 rounded-sm border border-hairline bg-surface-soft px-2 text-[14px] text-ink outline-none focus:border-ink"
          >
            {repos.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
          <span className="text-[13px] text-mute">· {period}</span>
        </div>
        <div className={cn("inline-flex items-center gap-2 rounded-sm border px-3 py-1 text-[13px] font-bold", RATING_STYLE[overall])}>
          desempenho geral: {overall}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {metrics.map((m) => (
          <div key={m.key} className="rounded-sm border border-hairline p-4">
            <div className="flex items-center justify-between">
              <span className="text-[13px] text-mute">{m.label}</span>
              <span className={cn("rounded-sm border px-2 py-0.5 text-[11px] font-bold", RATING_STYLE[m.rating])}>{m.rating}</span>
            </div>
            <div className="mt-2 text-[28px] font-bold tabular-nums text-ink">{m.value}</div>
            <div className="mt-1 text-[12px] text-mute">{m.detail}</div>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-sm border border-hairline">
        <div className="flex items-center justify-between border-b border-hairline px-4 py-3">
          <h3 className="text-[15px] font-bold text-ink">Insight por IA</h3>
          <button onClick={runInsight} disabled={busy} className="inline-flex h-8 items-center gap-1.5 rounded-sm bg-ink px-3 text-[13px] font-medium text-canvas hover:bg-ink-deep disabled:opacity-60">
            {busy ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />} Analisar DORA
          </button>
        </div>
        <div className="p-4">
          {err && <p className="text-[13px] text-warning">[!] {err}</p>}
          {!err && !insight && !busy && <p className="text-[13px] text-mute">Gere uma análise com IA dos seus números DORA e como chegar ao nível Elite.</p>}
          {busy && <p className="flex items-center gap-2 text-[13px] text-mute"><Loader2 className="size-3.5 animate-spin" /> analisando…</p>}
          {insight && <pre className="whitespace-pre-wrap break-words text-[13px] leading-relaxed text-charcoal">{insight}</pre>}
        </div>
      </div>
    </div>
  );
}
