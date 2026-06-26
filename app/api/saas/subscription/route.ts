import { NextResponse } from "next/server";

import { createAdminClient, getAccessForUser, getUserFromRequest } from "@/lib/saas";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const access = await getAccessForUser(user.id, user.email ?? null);
  const admin = createAdminClient();
  const { data: sub } = await admin
    .from("app_subscriptions")
    .select("plan_slug,status,cycle,current_period_end,cancel_at_period_end,refund_eligible_until")
    .eq("user_id", user.id)
    .maybeSingle();
  const { data: plan } = await admin.from("app_plans").select("slug,name").eq("slug", access.plan_slug).maybeSingle();

  return NextResponse.json({
    is_admin: access.is_admin,
    plan,
    plan_slug: access.plan_slug,
    trial_active: access.trial_active,
    trial_ends_at: access.trial_ends_at,
    subscription: sub,
  });
}
