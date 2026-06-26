"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { Eye, EyeOff, Github, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Brand } from "@/components/site/marketing";
import { TuiMockup } from "@/components/site/tui-mockup";
import { createSupabaseBrowser } from "@/lib/supabase/client";

type Mode = "login" | "signup" | "forgot" | "reset";

const TITLES: Record<Mode, { h: string; p: string }> = {
  login: { h: "Bem-vindo de volta", p: "Entre para acessar seus analytics." },
  signup: { h: "Crie sua conta", p: "7 dias de Pro grátis, sem cartão." },
  forgot: { h: "Recuperar senha", p: "Enviaremos um link para o seu e-mail." },
  reset: { h: "Definir nova senha", p: "Escolha uma nova senha para a conta." },
};

function LoginInner() {
  const router = useRouter();
  const params = useSearchParams();
  const supabase = React.useMemo(() => createSupabaseBrowser(), []);

  const initialMode = (params.get("mode") as Mode) || "login";
  const next = params.get("next") || "/dashboard";
  const [mode, setMode] = React.useState<Mode>(initialMode);
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [fullName, setFullName] = React.useState("");
  const [show, setShow] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [notice, setNotice] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (params.get("error")) setError("Não foi possível autenticar. Tente novamente.");
  }, [params]);

  const t = TITLES[mode];

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setBusy(true);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push(next);
        router.refresh();
      } else if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
            emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
          },
        });
        if (error) throw error;
        if (data.session) {
          router.push(next);
          router.refresh();
        } else {
          setNotice("Conta criada! Confirme o e-mail que enviamos para ativar o acesso.");
        }
      } else if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent("/login?mode=reset")}`,
        });
        if (error) throw error;
        setNotice("Link de recuperação enviado. Verifique o seu e-mail.");
      } else if (mode === "reset") {
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
        setNotice("Senha alterada com sucesso. Você já pode entrar.");
        setMode("login");
      }
    } catch (err: any) {
      setError(err?.message || "Algo deu errado.");
    } finally {
      setBusy(false);
    }
  }

  async function oauthGithub() {
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
        scopes: "read:user user:email repo read:org",
      },
    });
    if (error) setError(error.message);
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Painel esquerdo — TUI escuro (DESIGN.md) */}
      <div className="relative hidden flex-col justify-between bg-surface-dark p-10 lg:flex">
        <Brand dark />
        <div className="mx-auto w-full max-w-md">
          <TuiMockup />
        </div>
        <div className="flex gap-6 text-[13px] text-ash">
          <Link href="/#planos" className="hover:text-canvas">Planos</Link>
          <Link href="/#faq" className="hover:text-canvas">FAQ</Link>
          <span>© {new Date().getFullYear()}</span>
        </div>
      </div>

      {/* Painel direito — formulário */}
      <div className="flex items-center justify-center bg-canvas p-6">
        <div className="w-full max-w-[400px]">
          <div className="mb-8 lg:hidden">
            <Brand />
          </div>

          <h1 className="text-[26px] font-bold tracking-tight text-ink">{t.h}</h1>
          <p className="mt-1 text-[14px] text-mute">{t.p}</p>

          {mode !== "reset" && mode !== "forgot" && (
            <>
              <button
                type="button"
                onClick={oauthGithub}
                className="mt-6 inline-flex h-10 w-full items-center justify-center gap-2 rounded-sm border border-hairline-strong bg-canvas font-medium text-ink hover:bg-surface-soft"
              >
                <Github className="size-4" /> Continuar com GitHub
              </button>
              <div className="my-5 flex items-center gap-3 text-[12px] text-stone">
                <span className="h-px flex-1 bg-hairline" /> ou e-mail <span className="h-px flex-1 bg-hairline" />
              </div>
            </>
          )}

          <form onSubmit={submit} className="space-y-4">
            {mode === "signup" && (
              <div className="space-y-1.5">
                <Label htmlFor="name">Nome</Label>
                <Input id="name" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Seu nome" />
              </div>
            )}

            {mode !== "reset" && (
              <div className="space-y-1.5">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="voce@email.com"
                  autoComplete="email"
                />
              </div>
            )}

            {mode !== "forgot" && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">{mode === "reset" ? "Nova senha" : "Senha"}</Label>
                  {mode === "login" && (
                    <button type="button" onClick={() => setMode("forgot")} className="text-[13px] text-mute underline-offset-2 hover:text-ink hover:underline">
                      Esqueci a senha
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={show ? "text" : "password"}
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete={mode === "login" ? "current-password" : "new-password"}
                    className="pr-10"
                  />
                  <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-mute hover:text-ink">
                    {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>
            )}

            {mode === "login" && (
              <label className="flex items-center gap-2 text-[14px] text-body">
                <Checkbox defaultChecked /> Manter conectado por 30 dias
              </label>
            )}

            {error && <div className="rounded-sm border border-danger/30 bg-danger/5 px-3 py-2 text-[13px] text-danger">{error}</div>}
            {notice && <div className="rounded-sm border border-success/30 bg-success/5 px-3 py-2 text-[13px] text-charcoal">{notice}</div>}

            <Button type="submit" size="lg" className="w-full" disabled={busy}>
              {busy && <Loader2 className="size-4 animate-spin" />}
              {mode === "login" ? "Entrar" : mode === "signup" ? "Criar conta" : mode === "forgot" ? "Enviar link" : "Salvar senha"}
            </Button>
          </form>

          <div className="mt-6 text-center text-[14px] text-mute">
            {mode === "login" && (
              <>Não tem conta? <button onClick={() => setMode("signup")} className="font-medium text-ink hover:underline">Criar conta</button></>
            )}
            {mode === "signup" && (
              <>Já tem conta? <button onClick={() => setMode("login")} className="font-medium text-ink hover:underline">Entrar</button></>
            )}
            {(mode === "forgot" || mode === "reset") && (
              <button onClick={() => setMode("login")} className="font-medium text-ink hover:underline">Voltar ao login</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <React.Suspense fallback={<div className="grid min-h-screen place-items-center"><Loader2 className="size-5 animate-spin text-mute" /></div>}>
      <LoginInner />
    </React.Suspense>
  );
}
