/**
 * Cliente GitHub por-usuário. Recebe um token (OAuth do Supabase ou PAT salvo
 * em github_connections) e expõe os dados usados nos Analytics e na Gestão.
 * Sem token, cai no GITHUB_TOKEN de fallback (apenas para demos públicas).
 */
const BASE = process.env.GITHUB_API_BASE || "https://api.github.com";

export type RepoSummary = {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  fork: boolean;
  archived: boolean;
  html_url: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  watchers_count: number;
  size: number;
  default_branch: string;
  pushed_at: string;
  updated_at: string;
  created_at: string;
  owner: { login: string; avatar_url: string };
  topics?: string[];
};

export class GitHubClient {
  constructor(private token: string | null = process.env.GITHUB_TOKEN || null) {}

  get hasToken() {
    return !!this.token;
  }

  private headers(): HeadersInit {
    const h: Record<string, string> = { Accept: "application/vnd.github+json" };
    if (this.token) h.Authorization = `Bearer ${this.token}`;
    return h;
  }

  async get<T = any>(path: string, params?: Record<string, string>, revalidate = 300): Promise<T | null> {
    const u = new URL(path.startsWith("http") ? path : `${BASE}${path}`);
    if (params) Object.entries(params).forEach(([k, v]) => u.searchParams.set(k, v));
    try {
      const res = await fetch(u.toString(), { headers: this.headers(), next: { revalidate } });
      if (!res.ok) return null;
      return (await res.json()) as T;
    } catch {
      return null;
    }
  }

  async getAll<T = any>(path: string, params: Record<string, string> = {}, maxPages = 5): Promise<T[]> {
    const out: T[] = [];
    for (let page = 1; page <= maxPages; page++) {
      const data = await this.get<T[]>(path, { per_page: "100", page: String(page), ...params });
      if (!Array.isArray(data) || data.length === 0) break;
      out.push(...data);
      if (data.length < 100) break;
    }
    return out;
  }

  /** Verifica o token e devolve o perfil + escopos. */
  async verify() {
    const u = new URL(`${BASE}/user`);
    try {
      const res = await fetch(u.toString(), { headers: this.headers(), cache: "no-store" });
      if (!res.ok) return { ok: false as const };
      const user = await res.json();
      const scopes = (res.headers.get("x-oauth-scopes") || "").split(",").map((s) => s.trim()).filter(Boolean);
      const rateLimit = res.headers.get("x-ratelimit-remaining");
      return { ok: true as const, user, scopes, rateLimit };
    } catch {
      return { ok: false as const };
    }
  }

  profile() {
    return this.get("/user");
  }

  listRepos(params: Record<string, string> = {}) {
    return this.getAll<RepoSummary>("/user/repos", {
      visibility: "all",
      affiliation: "owner,collaborator,organization_member",
      sort: "pushed",
      ...params,
    });
  }

  repo(owner: string, repo: string) {
    return this.get<RepoSummary>(`/repos/${owner}/${repo}`);
  }

  languages(owner: string, repo: string) {
    return this.get<Record<string, number>>(`/repos/${owner}/${repo}/languages`);
  }

  contributors(owner: string, repo: string) {
    return this.getAll(`/repos/${owner}/${repo}/contributors`, { per_page: "30" }, 1);
  }

  commits(owner: string, repo: string, params: Record<string, string> = {}) {
    return this.getAll(`/repos/${owner}/${repo}/commits`, params, 3);
  }

  pulls(owner: string, repo: string, state = "all") {
    return this.getAll(`/repos/${owner}/${repo}/pulls`, { state, sort: "updated", direction: "desc" }, 2);
  }

  issues(owner: string, repo: string, state = "all") {
    return this.getAll(`/repos/${owner}/${repo}/issues`, { state, sort: "updated", direction: "desc" }, 2);
  }

  releases(owner: string, repo: string) {
    return this.getAll(`/repos/${owner}/${repo}/releases`, { per_page: "30" }, 1);
  }

  branches(owner: string, repo: string) {
    return this.getAll(`/repos/${owner}/${repo}/branches`, { per_page: "100" }, 1);
  }

  workflowRuns(owner: string, repo: string) {
    return this.get(`/repos/${owner}/${repo}/actions/runs`, { per_page: "30" });
  }

  participationStats(owner: string, repo: string) {
    return this.get<{ all: number[]; owner: number[] }>(`/repos/${owner}/${repo}/stats/participation`);
  }

  async readme(owner: string, repo: string): Promise<string | null> {
    const d = await this.get<{ content?: string }>(`/repos/${owner}/${repo}/readme`);
    if (!d?.content) return null;
    try {
      return Buffer.from(d.content, "base64").toString("utf-8");
    } catch {
      return null;
    }
  }

  async fileContent(owner: string, repo: string, path: string): Promise<string | null> {
    const d = await this.get<{ content?: string; encoding?: string }>(`/repos/${owner}/${repo}/contents/${path}`);
    if (!d?.content) return null;
    try {
      return Buffer.from(d.content, "base64").toString("utf-8");
    } catch {
      return null;
    }
  }
}

/* ───────────────── Agregações de Analytics (puras, testáveis) ───────────── */

export type RepoMetrics = {
  totalRepos: number;
  publicRepos: number;
  privateRepos: number;
  archived: number;
  forks: number;
  stars: number;
  forksCount: number;
  openIssues: number;
  languages: Record<string, number>;
  topLanguages: { name: string; bytes: number; pct: number }[];
  byStars: RepoSummary[];
  recentlyActive: RepoSummary[];
  staleRepos: RepoSummary[];
};

export function aggregateRepos(repos: RepoSummary[]): RepoMetrics {
  const langBytes: Record<string, number> = {};
  let stars = 0, forksCount = 0, openIssues = 0;
  for (const r of repos) {
    stars += r.stargazers_count || 0;
    forksCount += r.forks_count || 0;
    openIssues += r.open_issues_count || 0;
    if (r.language) langBytes[r.language] = (langBytes[r.language] || 0) + (r.size || 1);
  }
  const totalLang = Object.values(langBytes).reduce((a, b) => a + b, 0) || 1;
  const topLanguages = Object.entries(langBytes)
    .map(([name, bytes]) => ({ name, bytes, pct: Math.round((bytes / totalLang) * 1000) / 10 }))
    .sort((a, b) => b.bytes - a.bytes)
    .slice(0, 8);

  const now = Date.now();
  const staleMs = 1000 * 60 * 60 * 24 * 180;

  return {
    totalRepos: repos.length,
    publicRepos: repos.filter((r) => !r.private).length,
    privateRepos: repos.filter((r) => r.private).length,
    archived: repos.filter((r) => r.archived).length,
    forks: repos.filter((r) => r.fork).length,
    stars,
    forksCount,
    openIssues,
    languages: langBytes,
    topLanguages,
    byStars: [...repos].sort((a, b) => b.stargazers_count - a.stargazers_count).slice(0, 10),
    recentlyActive: [...repos]
      .sort((a, b) => new Date(b.pushed_at).getTime() - new Date(a.pushed_at).getTime())
      .slice(0, 10),
    staleRepos: repos.filter((r) => !r.archived && now - new Date(r.pushed_at).getTime() > staleMs).slice(0, 10),
  };
}
