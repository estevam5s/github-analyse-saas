import { NextResponse } from "next/server";

import { createAdminClient, getUserFromRequest, logAudit, stripeReq } from "@/lib/saas";

export const runtime = "nodejs";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://github-analyse-saas.vercel.app";

export async function POST(req: Request) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { slug, cycle } = await req.json().catch(() => ({}));
  if (!slug || slug === "free") return NextResponse.json({ error: "invalid_plan" }, { status: 400 });
  const interval = cycle === "year" ? "year" : "month";

  const admin = createAdminClient();
  const { data: plan } = await admin.from("app_plans").select("*").eq("slug", slug).maybeSingle();
  if (!plan) return NextResponse.json({ error: "plan_not_found" }, { status: 404 });
  const amount = interval === "year" ? plan.price_year : plan.price_month;
  if (!amount || amount <= 0) return NextResponse.json({ error: "invalid_amount" }, { status: 400 });

  // reaproveita customer existente
  const { data: sub } = await admin.from("app_subscriptions").select("stripe_customer_id").eq("user_id", user.id).maybeSingle();

  const params: Record<string, string> = {
    mode: "subscription",
    "line_items[0][quantity]": "1",
    "line_items[0][price_data][currency]": "brl",
    "line_items[0][price_data][unit_amount]": String(amount),
    "line_items[0][price_data][recurring][interval]": interval,
    "line_items[0][price_data][product_data][name]": `GitAnalytica ${plan.name} (${interval === "year" ? "anual" : "mensal"})`,
    success_url: `${APP_URL}/assinatura?success=1`,
    cancel_url: `${APP_URL}/assinatura?canceled=1`,
    allow_promotion_codes: "true",
    "metadata[user_id]": user.id,
    "metadata[slug]": slug,
    "metadata[cycle]": interval,
    "metadata[app]": "gitanalytica",
    "subscription_data[metadata][user_id]": user.id,
    "subscription_data[metadata][slug]": slug,
  };
  if (sub?.stripe_customer_id) params["customer"] = sub.stripe_customer_id;
  else params["customer_email"] = user.email || "";

  const session = await stripeReq("checkout/sessions", "POST", params);
  if (!session?.url) return NextResponse.json({ error: session?.error?.message || "stripe_error" }, { status: 500 });

  await logAudit({ actor: user.email, actor_id: user.id, action: "billing.checkout", target: slug, detail: { cycle: interval } });
  return NextResponse.json({ url: session.url });
}
