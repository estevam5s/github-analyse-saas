/**
 * Cálculo das 4 métricas DORA a partir de sinais do GitHub.
 * Funções puras — recebem dados já buscados e devolvem valores + ratings.
 */
export type Rating = "Elite" | "Alto" | "Médio" | "Baixo" | "—";

export type Metric = { key: string; label: string; value: string; rating: Rating; detail: string; raw: number };

const DAY = 86_400_000;
const HOUR = 3_600_000;

function median(nums: number[]): number {
  if (nums.length === 0) return 0;
  const s = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

function fmtDuration(ms: number): string {
  if (ms <= 0) return "—";
  if (ms < HOUR) return `${Math.round(ms / 60000)} min`;
  if (ms < DAY) return `${(ms / HOUR).toFixed(1)} h`;
  return `${(ms / DAY).toFixed(1)} dias`;
}

export type DoraInput = {
  windowDays: number;
  mergedPRs: { created_at: string; merged_at: string | null; base?: { ref?: string } }[];
  releases: { published_at: string | null }[];
  runs: { created_at: string; updated_at: string; conclusion: string | null; head_branch: string | null }[];
  defaultBranch: string;
};

export function computeDora(input: DoraInput): { metrics: Metric[]; period: string } {
  const now = Date.now();
  const since = now - input.windowDays * DAY;
  const weeks = Math.max(1, input.windowDays / 7);

  const merged = input.mergedPRs.filter((p) => p.merged_at && new Date(p.merged_at).getTime() >= since);
  const releases = input.releases.filter((r) => r.published_at && new Date(r.published_at).getTime() >= since);

  // 1) Deployment Frequency — releases, senão PRs mesclados ao branch padrão
  const deploys = releases.length > 0 ? releases.length : merged.filter((p) => (p.base?.ref ?? input.defaultBranch) === input.defaultBranch).length;
  const perWeek = deploys / weeks;
  const df: Metric = {
    key: "deploy_freq",
    label: "Frequência de deploy",
    value: deploys === 0 ? "0" : perWeek >= 1 ? `${perWeek.toFixed(1)}/semana` : `${(perWeek * 4.33).toFixed(1)}/mês`,
    raw: perWeek,
    rating: perWeek >= 7 ? "Elite" : perWeek >= 1 ? "Alto" : perWeek >= 0.23 ? "Médio" : deploys > 0 ? "Baixo" : "—",
    detail: `${deploys} deploy(s) em ${input.windowDays} dias (${releases.length ? "releases" : "PRs mesclados"})`,
  };

  // 2) Lead Time for Changes — mediana (merged_at - created_at) dos PRs
  const leadTimes = merged.map((p) => new Date(p.merged_at!).getTime() - new Date(p.created_at).getTime()).filter((x) => x > 0);
  const leadMed = median(leadTimes);
  const lt: Metric = {
    key: "lead_time",
    label: "Lead time de mudanças",
    value: leadTimes.length ? fmtDuration(leadMed) : "—",
    raw: leadMed,
    rating: leadTimes.length === 0 ? "—" : leadMed < DAY ? "Elite" : leadMed < 7 * DAY ? "Alto" : leadMed < 30 * DAY ? "Médio" : "Baixo",
    detail: `mediana de ${leadTimes.length} PR(s) (criação → merge)`,
  };

  // 3) Change Failure Rate — runs com failure / total no branch padrão
  const branchRuns = input.runs.filter((r) => (r.head_branch ?? input.defaultBranch) === input.defaultBranch && new Date(r.created_at).getTime() >= since && r.conclusion);
  const failures = branchRuns.filter((r) => r.conclusion === "failure").length;
  const cfr = branchRuns.length ? (failures / branchRuns.length) * 100 : 0;
  const cf: Metric = {
    key: "change_fail",
    label: "Taxa de falha de mudança",
    value: branchRuns.length ? `${cfr.toFixed(0)}%` : "—",
    raw: cfr,
    rating: branchRuns.length === 0 ? "—" : cfr <= 15 ? "Elite" : cfr <= 30 ? "Alto" : cfr <= 45 ? "Médio" : "Baixo",
    detail: `${failures} falha(s) em ${branchRuns.length} execução(ões) no ${input.defaultBranch}`,
  };

  // 4) MTTR — mediana do tempo de uma falha até o próximo sucesso no branch padrão
  const ordered = [...branchRuns].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  const restores: number[] = [];
  for (let i = 0; i < ordered.length; i++) {
    if (ordered[i].conclusion === "failure") {
      const next = ordered.slice(i + 1).find((r) => r.conclusion === "success");
      if (next) restores.push(new Date(next.updated_at).getTime() - new Date(ordered[i].created_at).getTime());
    }
  }
  const mttrMed = median(restores);
  const mt: Metric = {
    key: "mttr",
    label: "Tempo de restauração (MTTR)",
    value: restores.length ? fmtDuration(mttrMed) : "—",
    raw: mttrMed,
    rating: restores.length === 0 ? "—" : mttrMed < HOUR ? "Elite" : mttrMed < DAY ? "Alto" : mttrMed < 7 * DAY ? "Médio" : "Baixo",
    detail: `${restores.length} recuperação(ões) medidas`,
  };

  return { metrics: [df, lt, cf, mt], period: `últimos ${input.windowDays} dias` };
}

export const RATING_RANK: Record<Rating, number> = { Elite: 4, Alto: 3, "Médio": 2, "Baixo": 1, "—": 0 };

export function overallRating(metrics: Metric[]): Rating {
  const ranked = metrics.map((m) => RATING_RANK[m.rating]).filter((r) => r > 0);
  if (!ranked.length) return "—";
  const avg = ranked.reduce((a, b) => a + b, 0) / ranked.length;
  return (["—", "Baixo", "Médio", "Alto", "Elite"] as Rating[])[Math.round(avg)] ?? "—";
}
