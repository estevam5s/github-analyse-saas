import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { ListRow, SectionLabel, SiteFooter, SiteNav, Sparkline } from "@/components/site/marketing";
import { PricingSection } from "@/components/site/pricing-section";
import { TuiMockup } from "@/components/site/tui-mockup";
import { createAdminClient } from "@/lib/saas";
import type { Plan } from "@/components/site/plan-cards";

export const dynamic = "force-dynamic";

async function getPlans(): Promise<Plan[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("app_plans")
    .select("slug,name,description,price_month,price_year,features,highlighted,sort_order")
    .eq("active", true)
    .order("sort_order");
  return (data ?? []).map((p: any) => ({ ...p, features: Array.isArray(p.features) ? p.features : [] }));
}

const RECURSOS: [string, string][] = [
  ["Analytics de engenharia", "Commits, PRs, releases, contributors, cadência, lead time e DORA."],
  ["Gestão de repositórios", "Branches, issues, releases, actions e organizações em um só lugar."],
  ["Code review por IA", "Bugs, code smells e riscos de segurança em segundos."],
  ["Score de qualidade", "Nota A+→D por repositório, com pontos fortes e riscos."],
  ["Varredura de vulnerabilidades", "Heurística AppSec (OWASP) com severidade e correção."],
  ["Documentação automática", "README, changelog e análise de arquitetura gerados por IA."],
];

const IA: [string, string][] = [
  ["Explicação de código", "Entenda qualquer arquivo ou função em linguagem natural."],
  ["Pull Request inteligente", "Resumo das alterações, impacto e detecção de breaking changes."],
  ["Commits no padrão", "Mensagens Conventional Commits a partir do seu diff."],
  ["Arquitetura", "Avaliação de padrões, acoplamento e melhorias estruturais."],
];

const FAQ: [string, string][] = [
  ["Preciso dar acesso ao meu GitHub?", "Você conecta via OAuth do GitHub ou um token pessoal (PAT). O token fica restrito à sua conta e pode ser revogado a qualquer momento."],
  ["Como funciona o teste grátis?", "Ao criar a conta você recebe 7 dias no nível Pro, sem cartão. Depois, sem assinatura, a conta passa para o plano Inicial (Free)."],
  ["Posso pedir reembolso?", "Sim. Todos os planos pagos têm reembolso garantido em até 7 dias."],
  ["Os dados ficam seguros?", "Métricas e tokens ficam isolados por conta com RLS no Supabase. Tokens são usados apenas no servidor."],
];

export default async function LandingPage() {
  const plans = await getPlans();

  return (
    <div className="min-h-screen">
      <SiteNav />

      <main className="mx-auto max-w-content px-4">
        {/* HERO */}
        <section className="py-section">
          <div className="mb-5 flex items-center gap-2">
            <Badge variant="dark">Beta</Badge>
            <span className="text-[14px] text-mute">Analytics + IA para GitHub</span>
          </div>
          <h1 className="max-w-3xl text-display-xl text-ink">
            Métricas, gestão e Inteligência Artificial para o seu GitHub.
          </h1>
          <p className="mt-5 max-w-2xl text-body-md text-body">
            Tudo o que você precisa para medir produtividade, revisar código com IA e gerir
            repositórios — em uma interface enxuta, rápida e feita para quem vive no terminal.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/login?mode=signup"
              className="inline-flex h-9 items-center rounded-sm bg-ink px-5 font-medium text-canvas hover:bg-ink-deep"
            >
              Começar gratuitamente
            </Link>
            <a
              href="#planos"
              className="inline-flex h-9 items-center rounded-sm border border-hairline-strong px-5 font-medium text-ink hover:bg-surface-soft"
            >
              Ver planos
            </a>
          </div>

          {/* TUI mockup — única superfície escura */}
          <div className="mt-12">
            <TuiMockup />
          </div>

          {/* stats em sparkline ASCII */}
          <div className="mt-10 grid gap-6 border-t border-hairline pt-8 sm:grid-cols-3">
            <Sparkline data={[3, 6, 8, 5, 9, 12, 10, 14, 11, 16, 13, 18]} caption="Fig 1. commits / mês" />
            <Sparkline data={[2, 4, 3, 6, 5, 8, 7, 9, 8, 11, 10, 13]} caption="Fig 2. PRs mesclados" />
            <Sparkline data={[10, 9, 11, 8, 12, 10, 13, 11, 14, 12, 15, 16]} caption="Fig 3. score de qualidade" />
          </div>
        </section>

        {/* RECURSOS */}
        <section className="py-section">
          <SectionLabel id="recursos">Recursos</SectionLabel>
          <div className="mt-6 grid gap-x-10 sm:grid-cols-2">
            {RECURSOS.map(([label, desc]) => (
              <ListRow key={label} label={label} desc={desc} />
            ))}
          </div>
        </section>

        {/* IA */}
        <section className="py-section">
          <SectionLabel id="ia">Inteligência Artificial</SectionLabel>
          <p className="mt-4 max-w-2xl text-body-md text-body">
            IA aplicada em praticamente toda a plataforma — sempre com saída objetiva e acionável.
          </p>
          <div className="mt-6 grid gap-x-10 sm:grid-cols-2">
            {IA.map(([label, desc]) => (
              <ListRow key={label} marker="x" label={label} desc={desc} />
            ))}
          </div>
        </section>

        {/* PLANOS */}
        <section className="py-section">
          <SectionLabel id="planos">Planos</SectionLabel>
          <p className="mb-8 mt-4 max-w-2xl text-body-md text-body">
            Comece grátis. Evolua quando precisar de mais repositórios, IA e gestão.
          </p>
          <PricingSection plans={plans} />
        </section>

        {/* FAQ */}
        <section className="py-section">
          <SectionLabel id="faq">FAQ</SectionLabel>
          <div className="mt-4">
            {FAQ.map(([q, a]) => (
              <div key={q} className="border-b border-hairline py-3">
                <div className="flex gap-2 text-body-md text-ink">
                  <span className="ascii-marker">+</span>
                  <b>{q}</b>
                </div>
                <p className="mt-1 pl-5 text-body-md text-body">{a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="pb-section">
          <div className="rounded-sm bg-surface-dark px-8 py-12 text-center text-canvas">
            <h2 className="text-[24px] font-bold">Pronto para medir e evoluir o seu GitHub?</h2>
            <p className="mx-auto mt-3 max-w-md text-[15px] text-ash">
              Crie sua conta em segundos e ganhe 7 dias de Pro.
            </p>
            <Link
              href="/login?mode=signup"
              className="mt-6 inline-flex h-10 items-center rounded-sm bg-canvas px-6 font-medium text-ink hover:bg-surface-soft"
            >
              Começar gratuitamente
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
