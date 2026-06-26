import { NextResponse } from "next/server";

import { GitHubClient } from "@/lib/github";
import { createAdminClient, getUserFromRequest, logAudit } from "@/lib/saas";

export const runtime = "nodejs";

/** Conecta uma conta GitHub via Personal Access Token (PAT). */
export async function POST(req: Request) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { token } = await req.json().catch(() => ({}));
  if (!token || typeof token !== "string") return NextResponse.json({ error: "token_required" }, { status: 400 });

  const client = new GitHubClient(token.trim());
  const v = await client.verify();
  if (!v.ok) return NextResponse.json({ error: "invalid_token" }, { status: 400 });

  const admin = createAdminClient();
  await admin.from("github_connections").upsert(
    {
      user_id: user.id,
      github_username: v.user.login,
      access_token: token.trim(),
      token_type: "pat",
      scopes: v.scopes ?? [],
      avatar_url: v.user.avatar_url,
      connected_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );
  await admin.from("profiles").update({ github_username: v.user.login }).eq("id", user.id);
  await logAudit({ actor: user.email, actor_id: user.id, action: "github.connect", target: v.user.login });

  return NextResponse.json({ ok: true, username: v.user.login, avatar_url: v.user.avatar_url, scopes: v.scopes });
}

/** Desconecta a conta GitHub. */
export async function DELETE(req: Request) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const admin = createAdminClient();
  await admin.from("github_connections").delete().eq("user_id", user.id);
  await logAudit({ actor: user.email, actor_id: user.id, action: "github.disconnect" });
  return NextResponse.json({ ok: true });
}
