"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { Github, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createSupabaseBrowser } from "@/lib/supabase/client";

export function ConnectGitHub() {
  const router = useRouter();
  const [token, setToken] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function connectPat(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch("/api/gh/connect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    const d = await res.json();
    setBusy(false);
    if (d.ok) router.refresh();
    else setError(d.error === "invalid_token" ? "Token inválido ou sem permissão." : "Falha ao conectar.");
  }

  async function connectOAuth() {
    const supabase = createSupabaseBrowser();
    await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
        scopes: "read:user user:email repo read:org",
      },
    });
  }

  return (
    <div className="mx-auto max-w-lg rounded-sm border border-hairline p-6">
      <div className="flex items-center gap-2 text-ink">
        <Github className="size-5" />
        <h2 className="text-[18px] font-bold">Conecte o seu GitHub</h2>
      </div>
      <p className="mt-1 text-[14px] text-mute">
        Conecte via OAuth (recomendado) ou cole um Personal Access Token com escopo{" "}
        <code className="rounded-sm bg-surface-card px-1">repo</code> e{" "}
        <code className="rounded-sm bg-surface-card px-1">read:org</code>.
      </p>

      <Button onClick={connectOAuth} size="lg" className="mt-5 w-full">
        <Github className="size-4" /> Continuar com GitHub
      </Button>

      <div className="my-5 flex items-center gap-3 text-[12px] text-stone">
        <span className="h-px flex-1 bg-hairline" /> ou token pessoal <span className="h-px flex-1 bg-hairline" />
      </div>

      <form onSubmit={connectPat} className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="pat">Personal Access Token</Label>
          <Input id="pat" value={token} onChange={(e) => setToken(e.target.value)} placeholder="ghp_..." />
        </div>
        {error && <p className="text-[13px] text-danger">{error}</p>}
        <Button type="submit" variant="secondary" className="w-full" disabled={busy || !token}>
          {busy && <Loader2 className="size-4 animate-spin" />} Conectar com token
        </Button>
      </form>
      <p className="mt-3 text-[12px] text-stone">
        Gere em github.com/settings/tokens. O token é usado apenas no servidor e pode ser revogado a qualquer momento.
      </p>
    </div>
  );
}
