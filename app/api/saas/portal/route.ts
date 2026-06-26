import { NextResponse } from "next/server";

import { createAdminClient, getUserFromRequest, stripeReq } from "@/lib/saas";

export const runtime = "nodejs";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://github-analyse-saas.vercel.app";

export async function POST(req: Request) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const { data: sub } = await admin.from("app_subscriptions").select("stripe_customer_id").eq("user_id", user.id).maybeSingle();
  if (!sub?.stripe_customer_id) return NextResponse.json({ error: "no_customer" }, { status: 400 });

  const portal = await stripeReq("billing_portal/sessions", "POST", {
    customer: sub.stripe_customer_id,
    return_url: `${APP_URL}/assinatura`,
  });
  if (!portal?.url) return NextResponse.json({ error: "stripe_error" }, { status: 500 });
  return NextResponse.json({ url: portal.url });
}
