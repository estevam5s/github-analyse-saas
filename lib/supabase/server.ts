import { cookies } from "next/headers";

import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/** Cliente ligado aos cookies da sessão (RLS aplicada como o usuário). */
export async function createSupabaseServer() {
  const cookieStore = await cookies();
  return createServerClient(URL, ANON, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (toSet) => {
        try {
          toSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          /* chamado de Server Component — ignorado, o middleware renova a sessão */
        }
      },
    },
  });
}

/** Cliente service_role — ignora RLS. Apenas em rotas/serviços de servidor. */
export function createAdminClient() {
  return createClient(URL, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
