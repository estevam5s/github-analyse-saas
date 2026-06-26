import { NextResponse } from "next/server";

import { createAdminClient, logAudit, stripeReq, verifyStripeSignature } from "@/lib/saas";

export const runtime = "nodejs";

const REFUND_DAYS = Number(process.env.REFUND_DAYS || 7);

export async function POST(req: Request) {
  const payload = await req.text();
  const sig = req.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET || "";

  if (secret) {
    const ok = await verifyStripeSignature(payload, sig, secret);
    if (!ok) return NextResponse.json({ error: "bad_signature" }, { status: 400 });
  }

  let event: any;
  try {
    event = JSON.parse(payload);
  } catch {
    return NextResponse.json({ error: "bad_payload" }, { status: 400 });
  }

  const admin = createAdminClient();

  // idempotência
  const { error: dup } = await admin.from("app_payment_events").insert({ event_id: event.id, type: event.type });
  if (dup) return NextResponse.json({ received: true, duplicate: true });

  const obj = event.data?.object ?? {};

  try {
    if (event.type === "checkout.session.completed") {
      const userId = obj.metadata?.user_id;
      const slug = obj.metadata?.slug || "pro";
      const cycle = obj.metadata?.cycle || "month";
      if (userId) {
        const refundUntil = new Date(Date.now() + REFUND_DAYS * 86_400_000).toISOString();
        await admin.from("app_subscriptions").upsert(
          {
            user_id: userId,
            plan_slug: slug,
            status: "active",
            cycle,
            stripe_customer_id: obj.customer,
            stripe_subscription_id: obj.subscription,
            refund_eligible_until: refundUntil,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" },
        );
        await admin.from("profiles").update({ plan_slug: slug, blocked: false }).eq("id", userId);
        await logAudit({ actor_id: userId, action: "billing.activated", target: slug });
      }
    } else if (event.type === "customer.subscription.updated") {
      const userId = obj.metadata?.user_id;
      const slug = obj.metadata?.slug;
      const status = obj.status;
      const patch: Record<string, unknown> = {
        status,
        cancel_at_period_end: obj.cancel_at_period_end ?? false,
        current_period_end: obj.current_period_end ? new Date(obj.current_period_end * 1000).toISOString() : null,
        updated_at: new Date().toISOString(),
      };
      if (slug) patch.plan_slug = slug;
      if (userId) {
        await admin.from("app_subscriptions").update(patch).eq("user_id", userId);
        if (slug && ["active", "trialing"].includes(status)) await admin.from("profiles").update({ plan_slug: slug }).eq("id", userId);
      } else if (obj.customer) {
        await admin.from("app_subscriptions").update(patch).eq("stripe_customer_id", obj.customer);
      }
    } else if (event.type === "customer.subscription.deleted") {
      const userId = obj.metadata?.user_id;
      if (userId) {
        await admin.from("app_subscriptions").update({ status: "canceled", plan_slug: "free", updated_at: new Date().toISOString() }).eq("user_id", userId);
        await admin.from("profiles").update({ plan_slug: "free" }).eq("id", userId);
        await logAudit({ actor_id: userId, action: "billing.canceled" });
      } else if (obj.customer) {
        await admin.from("app_subscriptions").update({ status: "canceled", plan_slug: "free" }).eq("stripe_customer_id", obj.customer);
      }
    }
  } catch {
    return NextResponse.json({ error: "handler_failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

export async function GET() {
  // util p/ smoke-test
  const enabled = !!process.env.STRIPE_SECRET_KEY;
  await stripeReq; // noop ref
  return NextResponse.json({ ok: true, stripe: enabled });
}
