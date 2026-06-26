import { NextResponse } from "next/server";

import { createAdminClient, getAccessForUser, getUserFromRequest, logAudit } from "@/lib/saas";

export const runtime = "nodejs";

/** Ações de gestão no GitHub (gated por org_management). */
export async function POST(req: Request) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const access = await getAccessForUser(user.id, user.email ?? null);
  if (!access.limits.org_management) return NextResponse.json({ error: "plan_required" }, { status: 402 });

  const admin = createAdminClient();
  const { data: conn } = await admin.from("github_connections").select("access_token").eq("user_id", user.id).maybeSingle();
  if (!conn?.access_token) return NextResponse.json({ error: "github_not_connected" }, { status: 400 });

  const body = await req.json().catch(() => ({}));
  const action = String(body.action || "");
  const headers = {
    Authorization: `Bearer ${conn.access_token}`,
    Accept: "application/vnd.github+json",
    "Content-Type": "application/json",
  };

  try {
    if (action === "create_issue") {
      const { repo, title, issue_body } = body;
      if (!repo || !title) return NextResponse.json({ error: "missing_fields" }, { status: 400 });
      const res = await fetch(`https://api.github.com/repos/${repo}/issues`, {
        method: "POST",
        headers,
        body: JSON.stringify({ title, body: issue_body || "" }),
      });
      const d = await res.json();
      if (!res.ok) return NextResponse.json({ error: d.message || "github_error" }, { status: 400 });
      await logAudit({ actor: user.email, actor_id: user.id, action: "gh.create_issue", target: repo });
      return NextResponse.json({ ok: true, url: d.html_url, number: d.number });
    }

    if (action === "create_repo") {
      const { name, description, isPrivate } = body;
      if (!name) return NextResponse.json({ error: "missing_fields" }, { status: 400 });
      const res = await fetch(`https://api.github.com/user/repos`, {
        method: "POST",
        headers,
        body: JSON.stringify({ name, description: description || "", private: !!isPrivate, auto_init: true }),
      });
      const d = await res.json();
      if (!res.ok) return NextResponse.json({ error: d.message || "github_error" }, { status: 400 });
      await logAudit({ actor: user.email, actor_id: user.id, action: "gh.create_repo", target: d.full_name });
      return NextResponse.json({ ok: true, url: d.html_url, full_name: d.full_name });
    }

    return NextResponse.json({ error: "invalid_action" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}
