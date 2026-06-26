"use client";

import * as React from "react";

import { Search } from "lucide-react";

import type { RepoSummary } from "@/lib/github";
import { fmtInt } from "@/lib/utils";
import { cn } from "@/lib/utils";

type Filter = "all" | "public" | "private" | "archived" | "forks";

export function RepoList({ repos }: { repos: RepoSummary[] }) {
  const [q, setQ] = React.useState("");
  const [filter, setFilter] = React.useState<Filter>("all");
  const [sort, setSort] = React.useState<"pushed" | "stars" | "name">("pushed");

  const filtered = React.useMemo(() => {
    const term = q.trim().toLowerCase();
    let list = repos.filter((r) => {
      if (filter === "public" && r.private) return false;
      if (filter === "private" && !r.private) return false;
      if (filter === "archived" && !r.archived) return false;
      if (filter === "forks" && !r.fork) return false;
      if (term && !`${r.full_name} ${r.description ?? ""} ${r.language ?? ""}`.toLowerCase().includes(term)) return false;
      return true;
    });
    list = [...list].sort((a, b) => {
      if (sort === "stars") return b.stargazers_count - a.stargazers_count;
      if (sort === "name") return a.name.localeCompare(b.name);
      return new Date(b.pushed_at).getTime() - new Date(a.pushed_at).getTime();
    });
    return list;
  }, [repos, q, filter, sort]);

  const filters: [Filter, string][] = [
    ["all", "Todos"], ["public", "Públicos"], ["private", "Privados"], ["archived", "Arquivados"], ["forks", "Forks"],
  ];

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-mute" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar repositório…"
            className="h-10 w-full rounded-sm border border-hairline bg-surface-soft pl-9 pr-3 text-[14px] outline-none focus:border-ink focus:bg-canvas"
          />
        </div>
        <select value={sort} onChange={(e) => setSort(e.target.value as any)} className="h-10 rounded-sm border border-hairline bg-surface-soft px-2 text-[14px] outline-none focus:border-ink">
          <option value="pushed">Recentes</option>
          <option value="stars">Estrelas</option>
          <option value="name">A–Z</option>
        </select>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {filters.map(([f, label]) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "rounded-sm border px-3 py-1 text-[13px] font-medium",
              filter === f ? "border-ink bg-ink text-canvas" : "border-hairline-strong text-mute hover:text-ink",
            )}
          >
            {label}
          </button>
        ))}
        <span className="ml-auto self-center text-[13px] text-mute">{filtered.length} repos</span>
      </div>

      <div className="divide-y divide-hairline rounded-sm border border-hairline">
        {filtered.map((r) => (
          <a key={r.id} href={r.html_url} target="_blank" rel="noopener noreferrer" className="block px-4 py-3 hover:bg-surface-soft">
            <div className="flex items-center gap-2">
              <span className="ascii-marker text-ink">[{r.archived ? "x" : r.fork ? "-" : "+"}]</span>
              <span className="truncate font-medium text-ink">{r.full_name}</span>
              {r.private && <span className="rounded-sm border border-hairline-strong px-1.5 text-[11px] text-mute">privado</span>}
              {r.archived && <span className="rounded-sm border border-hairline-strong px-1.5 text-[11px] text-mute">arquivado</span>}
              <span className="ml-auto flex shrink-0 items-center gap-3 text-[12px] text-mute">
                {r.language && <span>{r.language}</span>}
                <span>★ {fmtInt(r.stargazers_count)}</span>
                <span>⑂ {fmtInt(r.forks_count)}</span>
              </span>
            </div>
            {r.description && <p className="mt-1 line-clamp-1 pl-7 text-[13px] text-body">{r.description}</p>}
          </a>
        ))}
        {filtered.length === 0 && <p className="px-4 py-10 text-center text-[14px] text-mute">Nenhum repositório encontrado.</p>}
      </div>
    </div>
  );
}
