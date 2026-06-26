import { type NextRequest, NextResponse } from "next/server";

import { createSupabaseServer } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/saas";

/**
 * Callback de OAuth (GitHub) e de links de e-mail (confirmação / recuperação).
 * Troca o `code` por sessão. Se houver provider_token do GitHub, salva a conexão.
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") || "/dashboard";
  const origin = url.origin;

  if (!code) return NextResponse.redirect(`${origin}/login?error=missing_code`);

  const supabase = await createSupabaseServer();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return NextResponse.redirect(`${origin}/login?error=auth`);

  // Persiste a conexão GitHub quando o login foi via OAuth (provider_token disponível).
  try {
    const providerToken = (data.session as any)?.provider_token as string | undefined;
    const user = data.user;
    if (providerToken && user) {
      const admin = createAdminClient();
      const ghUser = user.user_metadata?.user_name || user.user_metadata?.preferred_username || null;
      await admin.from("github_connections").upsert(
        {
          user_id: user.id,
          github_username: ghUser,
          access_token: providerToken,
          token_type: "oauth",
          scopes: ["read:user", "repo", "read:org"],
          avatar_url: user.user_metadata?.avatar_url ?? null,
          connected_at: new Date().toISOString(),
        },
        { onConflict: "user_id" },
      );
      if (ghUser) await admin.from("profiles").update({ github_username: ghUser }).eq("id", user.id);
    }
  } catch {
    /* não bloqueia o login */
  }

  return NextResponse.redirect(`${origin}${next}`);
}
