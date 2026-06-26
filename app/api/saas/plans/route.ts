import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/saas";

export const runtime = "nodejs";

export async function GET() {
  const admin = createAdminClient();
  const { data } = await admin
    .from("app_plans")
    .select("slug,name,description,price_month,price_year,features,highlighted,sort_order")
    .eq("active", true)
    .order("sort_order");
  const plans = (data ?? []).map((p: any) => ({ ...p, features: Array.isArray(p.features) ? p.features : [] }));
  return NextResponse.json({ plans });
}
