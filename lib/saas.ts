import { createClient } from "@supabase/supabase-js";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;

/** Cliente service_role (ignora RLS). Use somente no servidor. */
export function createAdminClient() {
  return createClient(URL, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export function isAdminEmail(email?: string | null) {
  if (!email) return false;
  const list = (process.env.ADMIN_EMAILS || process.env.NEXT_PUBLIC_ADMIN_EMAILS || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return list.includes(email.toLowerCase());
}

/** Resolve o usuário a partir do Bearer token OU do cookie de sessão (@supabase/ssr). */
export async function getUserFromRequest(req: Request) {
  const auth = req.headers.get("authorization") || "";
  const bearer = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (bearer) {
    const sb = createClient(URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      global: { headers: { Authorization: `Bearer ${bearer}` } },
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data } = await sb.auth.getUser();
    if (data.user) return data.user;
  }
  try {
    const { createSupabaseServer } = await import("./supabase/server");
    const sb = await createSupabaseServer();
    const { data } = await sb.auth.getUser();
    return data.user ?? null;
  } catch {
    return null;
  }
}

/* ───────────────────────── Planos & gating ───────────────────────── */

export type Limits = {
  repos: number; // -1 = ilimitado
  ai_per_month: number;
  history_days: number;
  members: number;
  advanced_analytics: boolean;
  code_review_ai: boolean;
  vuln_scan: boolean;
  org_management: boolean;
  api_access: boolean;
  webhooks: boolean;
  priority_support: boolean;
  white_label: boolean;
};

export const PLAN_LIMITS: Record<string, Limits> = {
  free: {
    repos: 3, ai_per_month: 25, history_days: 30, members: 1,
    advanced_analytics: false, code_review_ai: false, vuln_scan: false,
    org_management: false, api_access: false, webhooks: false, priority_support: false, white_label: false,
  },
  starter: {
    repos: 15, ai_per_month: 300, history_days: 180, members: 3,
    advanced_analytics: true, code_review_ai: true, vuln_scan: false,
    org_management: false, api_access: false, webhooks: true, priority_support: false, white_label: false,
  },
  pro: {
    repos: 60, ai_per_month: 2000, history_days: 365, members: 10,
    advanced_analytics: true, code_review_ai: true, vuln_scan: true,
    org_management: true, api_access: true, webhooks: true, priority_support: true, white_label: false,
  },
  team: {
    repos: 250, ai_per_month: 10000, history_days: 730, members: 50,
    advanced_analytics: true, code_review_ai: true, vuln_scan: true,
    org_management: true, api_access: true, webhooks: true, priority_support: true, white_label: false,
  },
  enterprise: {
    repos: -1, ai_per_month: -1, history_days: -1, members: -1,
    advanced_analytics: true, code_review_ai: true, vuln_scan: true,
    org_management: true, api_access: true, webhooks: true, priority_support: true, white_label: true,
  },
};

export type Access = {
  user_id: string;
  email: string | null;
  is_admin: boolean;
  plan_slug: string;
  status: string;
  trial_active: boolean;
  trial_ends_at: string | null;
  blocked: boolean;
  refund_eligible_until: string | null;
  limits: Limits;
};

/**
 * Calcula o acesso efetivo do usuário: admin = enterprise; trial ativo = nível Pro;
 * trial expirado sem assinatura = free (bloqueado p/ premium).
 */
export async function getAccessForUser(userId: string, email: string | null): Promise<Access> {
  const admin = createAdminClient();
  const [{ data: profile }, { data: sub }] = await Promise.all([
    admin.from("profiles").select("plan_slug,trial_ends_at,blocked").eq("id", userId).maybeSingle(),
    admin
      .from("app_subscriptions")
      .select("plan_slug,status,current_period_end,refund_eligible_until")
      .eq("user_id", userId)
      .maybeSingle(),
  ]);

  if (isAdminEmail(email)) {
    return {
      user_id: userId, email, is_admin: true, plan_slug: "enterprise", status: "active",
      trial_active: false, trial_ends_at: null, blocked: false, refund_eligible_until: null,
      limits: PLAN_LIMITS.enterprise,
    };
  }

  const now = Date.now();
  const trialEnds = profile?.trial_ends_at ? new Date(profile.trial_ends_at).getTime() : 0;
  const trialActive = trialEnds > now;
  const paidActive = sub && ["active", "trialing"].includes(sub.status) && sub.plan_slug !== "free";

  let plan = "free";
  let status = sub?.status || "inactive";
  if (paidActive) plan = sub!.plan_slug;
  else if (trialActive) plan = "pro"; // trial dá nível Pro

  return {
    user_id: userId,
    email,
    is_admin: false,
    plan_slug: plan,
    status,
    trial_active: trialActive && !paidActive,
    trial_ends_at: profile?.trial_ends_at ?? null,
    blocked: !!profile?.blocked && !paidActive && !trialActive,
    refund_eligible_until: sub?.refund_eligible_until ?? null,
    limits: PLAN_LIMITS[plan] ?? PLAN_LIMITS.free,
  };
}

/** Garante que o requisitante é admin. Retorna o user ou null. */
export async function requireAdmin(req: Request) {
  const user = await getUserFromRequest(req);
  if (!user || !isAdminEmail(user.email)) return null;
  return user;
}

export async function logAudit(entry: {
  actor?: string | null;
  actor_id?: string | null;
  level?: string;
  action: string;
  target?: string | null;
  detail?: Record<string, unknown>;
}) {
  try {
    const admin = createAdminClient();
    await admin.from("saas_audit_logs").insert({
      actor: entry.actor ?? null,
      actor_id: entry.actor_id ?? null,
      level: entry.level ?? "info",
      action: entry.action,
      target: entry.target ?? null,
      detail: entry.detail ?? {},
    });
  } catch {
    /* logging nunca quebra o fluxo */
  }
}

/* ───────────────────────── Stripe (REST cru) ─────────────────────── */

export async function stripeReq(path: string, method = "GET", body?: Record<string, string>) {
  const res = await fetch(`https://api.stripe.com/v1/${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body ? new URLSearchParams(body).toString() : undefined,
  });
  return res.json();
}

/** Verifica assinatura do webhook Stripe (HMAC-SHA256, sem dependência extra). */
export async function verifyStripeSignature(payload: string, sigHeader: string | null, secret: string) {
  if (!sigHeader || !secret) return false;
  const parts = Object.fromEntries(sigHeader.split(",").map((p) => p.split("=")));
  const t = parts["t"];
  const v1 = parts["v1"];
  if (!t || !v1) return false;
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const mac = await crypto.subtle.sign("HMAC", key, enc.encode(`${t}.${payload}`));
  const hex = Array.from(new Uint8Array(mac)).map((b) => b.toString(16).padStart(2, "0")).join("");
  return hex === v1;
}
