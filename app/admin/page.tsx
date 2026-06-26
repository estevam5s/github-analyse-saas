import { redirect } from "next/navigation";

import { TopReturn } from "@/components/dashboard/top-return";
import { AdminPanel } from "@/components/admin/admin-panel";
import { createSupabaseServer } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/saas";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin" };

export default async function AdminPage() {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin");
  if (!isAdminEmail(user.email)) redirect("/dashboard");

  return (
    <div className="min-h-screen">
      <TopReturn />
      <AdminPanel />
    </div>
  );
}
