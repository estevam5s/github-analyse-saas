import { NextResponse } from "next/server";

import { createAdminClient, logAudit, requireAdmin, stripeReq } from "@/lib/saas";

export const runtime = "nodejs";

const BACKUP_TABLES = [
  "profiles", "app_plans", "app_subscriptions", "app_usage", "github_connections",
  "repositories", "ai_jobs", "saas_products", "saas_promotions", "saas_audit_logs",
  "saas_service_status", "saas_seo_settings", "saas_feature_flags", "saas_support_tickets",
  "saas_finance_entries", "saas_api_keys",
];

export async function GET(req: Request) {
  const user = await requireAdmin(req);
  if (!user) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const admin = createAdminClient();
  const module = new URL(req.url).searchParams.get("module") || "overview";

  switch (module) {
    case "overview": {
      const { data: ov } = await admin.from("admin_overview").select("*").maybeSingle();
      const { data: byPlan } = await admin.from("app_subscriptions").select("plan_slug,status");
      const dist: Record<string, number> = {};
      (byPlan ?? []).forEach((s: any) => { dist[s.plan_slug] = (dist[s.plan_slug] || 0) + 1; });
      return NextResponse.json({ overview: ov, planDistribution: dist });
    }
    case "users": {
      const { data: profiles } = await admin.from("profiles").select("id,email,full_name,plan_slug,trial_ends_at,blocked,role,github_username,created_at").order("created_at", { ascending: false }).limit(500);
      const { data: subs } = await admin.from("app_subscriptions").select("user_id,status,current_period_end");
      const subMap = new Map((subs ?? []).map((s: any) => [s.user_id, s]));
      const users = (profiles ?? []).map((p: any) => ({ ...p, sub: subMap.get(p.id) ?? null }));
      return NextResponse.json({ users });
    }
    case "plans": {
      const { data } = await admin.from("app_plans").select("*").order("sort_order");
      return NextResponse.json({ plans: data ?? [] });
    }
    case "subscriptions": {
      const { data } = await admin.from("app_subscriptions").select("*").order("updated_at", { ascending: false }).limit(500);
      return NextResponse.json({ subscriptions: data ?? [] });
    }
    case "payments": {
      const { data } = await admin.from("app_payment_events").select("*").order("created_at", { ascending: false }).limit(200);
      return NextResponse.json({ payments: data ?? [] });
    }
    case "logs": {
      const { data } = await admin.from("saas_audit_logs").select("*").order("created_at", { ascending: false }).limit(300);
      return NextResponse.json({ logs: data ?? [] });
    }
    case "monitoring": {
      const { data } = await admin.from("saas_service_status").select("*").order("service");
      return NextResponse.json({ services: data ?? [] });
    }
    case "products": {
      const { data } = await admin.from("saas_products").select("*").order("sort_order");
      return NextResponse.json({ products: data ?? [] });
    }
    case "promotions": {
      const { data } = await admin.from("saas_promotions").select("*").order("created_at", { ascending: false });
      return NextResponse.json({ promotions: data ?? [] });
    }
    case "ai": {
      const { data } = await admin.from("ai_jobs").select("id,user_id,repo_full_name,kind,created_at").order("created_at", { ascending: false }).limit(200);
      const { count } = await admin.from("ai_jobs").select("*", { count: "exact", head: true });
      return NextResponse.json({ jobs: data ?? [], total: count ?? 0 });
    }
    case "seo": {
      const { data } = await admin.from("saas_seo_settings").select("*").eq("id", 1).maybeSingle();
      return NextResponse.json({ seo: data });
    }
    case "flags": {
      const { data } = await admin.from("saas_feature_flags").select("*").order("key");
      return NextResponse.json({ flags: data ?? [] });
    }
    case "support": {
      const { data } = await admin.from("saas_support_tickets").select("*").order("created_at", { ascending: false }).limit(200);
      return NextResponse.json({ tickets: data ?? [] });
    }
    case "visitors": {
      const { data } = await admin.from("saas_visitors").select("country,device,browser").limit(2000);
      const agg = (key: string) => {
        const m: Record<string, number> = {};
        (data ?? []).forEach((v: any) => { const k = v[key] || "—"; m[k] = (m[k] || 0) + 1; });
        return Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, 10);
      };
      return NextResponse.json({ total: data?.length ?? 0, byCountry: agg("country"), byDevice: agg("device"), byBrowser: agg("browser") });
    }
    case "keys": {
      const { data } = await admin.from("saas_api_keys").select("id,name,prefix,scopes,last_used,active,created_at").order("created_at", { ascending: false });
      return NextResponse.json({ keys: data ?? [] });
    }
    case "backups": {
      const { data } = await admin.from("saas_backups").select("*").order("created_at", { ascending: false }).limit(50);
      return NextResponse.json({ backups: data ?? [] });
    }
    default:
      return NextResponse.json({ error: "unknown_module" }, { status: 400 });
  }
}

export async function POST(req: Request) {
  const user = await requireAdmin(req);
  if (!user) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const admin = createAdminClient();
  const body = await req.json().catch(() => ({}));
  const action = String(body.action || "");

  try {
    switch (action) {
      case "user.update": {
        const patch: Record<string, unknown> = {};
        if (body.plan_slug) patch.plan_slug = body.plan_slug;
        if (typeof body.blocked === "boolean") patch.blocked = body.blocked;
        await admin.from("profiles").update(patch).eq("id", body.user_id);
        if (body.plan_slug) await admin.from("app_subscriptions").update({ plan_slug: body.plan_slug }).eq("user_id", body.user_id);
        await logAudit({ actor: user.email, actor_id: user.id, action: "admin.user.update", target: body.user_id, detail: patch });
        return NextResponse.json({ ok: true });
      }
      case "user.delete": {
        // remove dados + auth user (libera o e-mail)
        await admin.from("profiles").delete().eq("id", body.user_id);
        await admin.auth.admin.deleteUser(body.user_id).catch(() => {});
        await logAudit({ actor: user.email, actor_id: user.id, action: "admin.user.delete", target: body.user_id, level: "warn" });
        return NextResponse.json({ ok: true });
      }
      case "plan.update": {
        const patch: Record<string, unknown> = {};
        for (const f of ["price_month", "price_year", "name", "description", "highlighted", "active"]) if (body[f] !== undefined) patch[f] = body[f];
        await admin.from("app_plans").update(patch).eq("slug", body.slug);
        await logAudit({ actor: user.email, actor_id: user.id, action: "admin.plan.update", target: body.slug });
        return NextResponse.json({ ok: true });
      }
      case "flag.toggle": {
        await admin.from("saas_feature_flags").update({ enabled: !!body.enabled, updated_at: new Date().toISOString() }).eq("key", body.key);
        return NextResponse.json({ ok: true });
      }
      case "seo.update": {
        const patch: Record<string, unknown> = { id: 1, updated_at: new Date().toISOString() };
        for (const f of ["meta_title", "meta_description", "og_image", "twitter_handle", "canonical", "robots", "ga_id", "gtm_id", "gsc_verification"]) if (body[f] !== undefined) patch[f] = body[f];
        await admin.from("saas_seo_settings").upsert(patch, { onConflict: "id" });
        return NextResponse.json({ ok: true });
      }
      case "service.heartbeat": {
        const services = ["api", "database", "stripe", "github", "ai", "webhooks"];
        for (const s of services) await admin.from("saas_service_status").upsert({ service: s, status: "operational", checked_at: new Date().toISOString() }, { onConflict: "service" });
        return NextResponse.json({ ok: true });
      }
      case "promotion.create": {
        let coupon = null;
        if (body.use_stripe) {
          const c = await stripeReq("coupons", "POST", body.kind === "percent"
            ? { percent_off: String(body.value), duration: "once", name: body.code }
            : { amount_off: String(Math.round(Number(body.value) * 100)), currency: "brl", duration: "once", name: body.code });
          coupon = c?.id ?? null;
        }
        await admin.from("saas_promotions").insert({
          code: body.code, description: body.description, kind: body.kind, value: body.value,
          stripe_coupon: coupon, active: true, ends_at: body.ends_at || null,
        });
        await logAudit({ actor: user.email, actor_id: user.id, action: "admin.promotion.create", target: body.code });
        return NextResponse.json({ ok: true, coupon });
      }
      case "key.create": {
        const raw = "gha_" + crypto.randomUUID().replace(/-/g, "");
        const prefix = raw.slice(0, 12);
        const hashBuf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(raw));
        const key_hash = Array.from(new Uint8Array(hashBuf)).map((b) => b.toString(16).padStart(2, "0")).join("");
        await admin.from("saas_api_keys").insert({ name: body.name || "key", prefix, key_hash, scopes: body.scopes || ["read"] });
        await logAudit({ actor: user.email, actor_id: user.id, action: "admin.key.create", target: prefix });
        return NextResponse.json({ ok: true, key: raw }); // mostrado UMA vez
      }
      case "key.revoke": {
        await admin.from("saas_api_keys").update({ active: false }).eq("id", body.id);
        return NextResponse.json({ ok: true });
      }
      case "backup.create": {
        const dump: Record<string, unknown[]> = {};
        let total = 0;
        for (const t of BACKUP_TABLES) {
          const { data } = await admin.from(t).select("*").limit(10000);
          dump[t] = data ?? [];
          total += (data ?? []).length;
        }
        const json = JSON.stringify(dump);
        await admin.from("saas_backups").insert({ kind: "manual", size_bytes: json.length, tables_count: BACKUP_TABLES.length, status: "done", note: `${total} linhas` });
        await logAudit({ actor: user.email, actor_id: user.id, action: "admin.backup.create" });
        return NextResponse.json({ ok: true, backup: dump });
      }
      default:
        return NextResponse.json({ error: "unknown_action" }, { status: 400 });
    }
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "failed" }, { status: 500 });
  }
}
