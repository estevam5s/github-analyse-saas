"use client";

import * as React from "react";

import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function OrgManage({ repos }: { repos: string[] }) {
  const [tab, setTab] = React.useState<"issue" | "repo">("issue");
  const [busy, setBusy] = React.useState(false);
  const [result, setResult] = React.useState<{ ok: boolean; msg: string; url?: string } | null>(null);

  // create issue
  const [repo, setRepo] = React.useState(repos[0] ?? "");
  const [title, setTitle] = React.useState("");
  const [issueBody, setIssueBody] = React.useState("");
  // create repo
  const [name, setName] = React.useState("");
  const [desc, setDesc] = React.useState("");
  const [priv, setPriv] = React.useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setResult(null);
    const payload =
      tab === "issue"
        ? { action: "create_issue", repo, title, issue_body: issueBody }
        : { action: "create_repo", name, description: desc, isPrivate: priv };
    const res = await fetch("/api/gh/manage", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const d = await res.json();
    setBusy(false);
    if (d.ok) {
      setResult({ ok: true, msg: tab === "issue" ? `Issue #${d.number} criada.` : `Repositório ${d.full_name} criado.`, url: d.url });
      setTitle(""); setIssueBody(""); setName(""); setDesc("");
    } else {
      setResult({ ok: false, msg: d.error === "plan_required" ? "Recurso disponível no plano Pro+." : d.error || "Falha." });
    }
  }

  return (
    <div className="rounded-sm border border-hairline">
      <div className="flex border-b border-hairline">
        {(["issue", "repo"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-[14px] font-medium ${tab === t ? "border-b-2 border-ink text-ink" : "text-mute hover:text-ink"}`}
          >
            {t === "issue" ? "Nova issue" : "Novo repositório"}
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="space-y-3 p-4">
        {tab === "issue" ? (
          <>
            <div className="space-y-1.5">
              <Label>Repositório</Label>
              <select value={repo} onChange={(e) => setRepo(e.target.value)} className="h-10 w-full rounded-sm border border-hairline bg-surface-soft px-2 text-[14px] outline-none focus:border-ink">
                {repos.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Título</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Bug: ..." required />
            </div>
            <div className="space-y-1.5">
              <Label>Descrição</Label>
              <textarea value={issueBody} onChange={(e) => setIssueBody(e.target.value)} rows={4} className="w-full rounded-sm border border-hairline bg-surface-soft p-3 text-[14px] outline-none focus:border-ink focus:bg-canvas" placeholder="Detalhes…" />
            </div>
          </>
        ) : (
          <>
            <div className="space-y-1.5">
              <Label>Nome do repositório</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="meu-novo-repo" required />
            </div>
            <div className="space-y-1.5">
              <Label>Descrição</Label>
              <Input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Descrição curta" />
            </div>
            <label className="flex items-center gap-2 text-[14px] text-body">
              <input type="checkbox" checked={priv} onChange={(e) => setPriv(e.target.checked)} className="size-4 accent-ink" /> Repositório privado
            </label>
          </>
        )}

        {result && (
          <p className={`text-[13px] ${result.ok ? "text-charcoal" : "text-danger"}`}>
            [{result.ok ? "+" : "x"}] {result.msg}{" "}
            {result.url && <a href={result.url} target="_blank" rel="noopener noreferrer" className="text-ink underline">abrir →</a>}
          </p>
        )}

        <Button type="submit" disabled={busy}>
          {busy && <Loader2 className="size-4 animate-spin" />} {tab === "issue" ? "Criar issue" : "Criar repositório"}
        </Button>
      </form>
    </div>
  );
}
