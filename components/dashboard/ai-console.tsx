"use client";

import * as React from "react";
import Link from "next/link";

import { Loader2 } from "lucide-react";

import type { Limits } from "@/lib/saas";
import { cn } from "@/lib/utils";

type Action = { kind: string; label: string; feature?: keyof Limits };

const ACTIONS: Action[] = [
  { kind: "overview", label: "Resumo do repo" },
  { kind: "review", label: "Code review", feature: "code_review_ai" },
  { kind: "readme", label: "Gerar README", feature: "code_review_ai" },
  { kind: "architecture", label: "Arquitetura", feature: "advanced_analytics" },
  { kind: "quality", label: "Score de qualidade", feature: "advanced_analytics" },
  { kind: "vuln", label: "Vulnerabilidades", feature: "vuln_scan" },
];

export function AiConsole({ repos, limits }: { repos: string[]; limits: Limits }) {
  const [repo, setRepo] = React.useState(repos[0] ?? "");
  const [active, setActive] = React.useState<string | null>(null);
  const [output, setOutput] = React.useState<string>("");
  const [error, setError] = React.useState<string | null>(null);
  const [usage, setUsage] = React.useState<{ used: number; limit: number } | null>(null);

  async function run(kind: string) {
    setActive(kind);
    setError(null);
    setOutput("");
    try {
      const res = await fetch("/api/ai/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, repo }),
      });
      const d = await res.json();
      if (!res.ok) {
        if (d.error === "plan_required") setError(`Recurso disponível em planos superiores (${d.feature}).`);
        else if (d.error === "ai_limit") setError(`Cota de IA do mês atingida (${d.used}/${d.limit}).`);
        else setError("Não foi possível executar a análise.");
      } else {
        if (kind === "quality") {
          try {
            const q = JSON.parse(d.output);
            setOutput(`Score: ${q.score}/100  (${q.grade})\n\nResumo:\n${q.summary}\n\nPontos fortes:\n${(q.strengths || []).map((s: string) => "[+] " + s).join("\n")}\n\nRiscos:\n${(q.risks || []).map((s: string) => "[x] " + s).join("\n")}`);
          } catch {
            setOutput(d.output);
          }
        } else {
          setOutput(d.output);
        }
        setUsage({ used: d.used, limit: d.limit });
      }
    } catch {
      setError("Falha de rede.");
    } finally {
      setActive(null);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
      {/* controles */}
      <div className="space-y-3">
        <div className="rounded-sm border border-hairline p-3">
          <label className="text-[12px] uppercase tracking-wide text-mute">repositório</label>
          <select
            value={repo}
            onChange={(e) => setRepo(e.target.value)}
            className="mt-1 h-9 w-full rounded-sm border border-hairline bg-surface-soft px-2 text-[14px] text-ink outline-none focus:border-ink"
          >
            {repos.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>

        <div className="rounded-sm border border-hairline">
          {ACTIONS.map((a) => {
            const locked = a.feature ? !limits[a.feature] : false;
            const running = active === a.kind;
            return (
              <button
                key={a.kind}
                disabled={locked || !!active || !repo}
                onClick={() => run(a.kind)}
                className={cn(
                  "flex w-full items-center gap-2 border-b border-hairline px-3 py-2.5 text-left text-[14px] last:border-0 disabled:cursor-not-allowed",
                  locked ? "text-ash" : "text-charcoal hover:bg-surface-card",
                )}
              >
                <span className="ascii-marker text-ink">[{locked ? "-" : running ? "~" : "+"}]</span>
                {a.label}
                {running && <Loader2 className="ml-auto size-3.5 animate-spin" />}
                {locked && <span className="ml-auto text-[11px]">plano</span>}
              </button>
            );
          })}
        </div>
        {usage && (
          <p className="text-[12px] text-mute">
            IA no mês: {usage.used}{usage.limit === -1 ? "" : `/${usage.limit}`}
          </p>
        )}
        <Link href="/assinatura" className="block text-[12px] text-ink underline underline-offset-2">
          Liberar mais recursos →
        </Link>
      </div>

      {/* saída — terminal */}
      <div className="rounded-sm bg-surface-dark p-4 text-canvas">
        <div className="mb-3 flex items-center gap-2 text-ash">
          <span className="size-2.5 rounded-full bg-danger/80" />
          <span className="size-2.5 rounded-full bg-warning/80" />
          <span className="size-2.5 rounded-full bg-success/80" />
          <span className="ml-2 text-[12px]">saída — {repo || "—"}</span>
        </div>
        {error && <p className="text-[13px] text-warning">[!] {error}</p>}
        {!error && !output && !active && <p className="text-[13px] text-ash">Selecione um repositório e uma ação para começar.</p>}
        {active && <p className="flex items-center gap-2 text-[13px] text-ash"><Loader2 className="size-3.5 animate-spin" /> processando com IA…</p>}
        {output && <pre className="whitespace-pre-wrap break-words text-[13px] leading-relaxed text-canvas/90">{output}</pre>}
      </div>
    </div>
  );
}
