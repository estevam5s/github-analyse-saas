import Link from "next/link";

import { cn } from "@/lib/utils";

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "GitAnalytica";

/* ───────────────────────────── Wordmark ───────────────────────────── */
/** Marca: bloco ◰ + nome em mono bold. O "logo" é o próprio nome (DESIGN.md). */
export function Brand({ className, dark = false }: { className?: string; dark?: boolean }) {
  return (
    <Link href="/" className={cn("inline-flex items-center gap-2 font-bold tracking-tight", className)}>
      <span
        className={cn(
          "grid size-6 place-items-center rounded-sm text-[13px] leading-none",
          dark ? "bg-canvas text-ink" : "bg-ink text-canvas",
        )}
        aria-hidden
      >
        ◰
      </span>
      <span className={dark ? "text-canvas" : "text-ink"}>{APP_NAME}</span>
    </Link>
  );
}

/* ───────────────────────────── Nav ───────────────────────────── */
export function SiteNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-hairline bg-canvas/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-frame items-center justify-between gap-4 px-4">
        <Brand />
        <nav className="hidden items-center gap-6 text-[15px] text-body md:flex">
          <a href="/#recursos" className="hover:text-ink">Recursos</a>
          <a href="/#ia" className="hover:text-ink">IA</a>
          <a href="/#planos" className="hover:text-ink">Planos</a>
          <a href="/#faq" className="hover:text-ink">FAQ</a>
        </nav>
        <div className="flex items-center gap-3 text-[15px]">
          <Link href="/login" className="text-body hover:text-ink">Entrar</Link>
          <Link
            href="/login?mode=signup"
            className="inline-flex h-9 items-center rounded-sm bg-ink px-4 font-medium text-canvas hover:bg-ink-deep"
          >
            Começar grátis
          </Link>
        </div>
      </div>
    </header>
  );
}

/* ───────────────────────────── Footer ───────────────────────────── */
export function SiteFooter() {
  const cols: [string, [string, string][]][] = [
    ["Produto", [["Recursos", "/#recursos"], ["Planos", "/#planos"], ["IA", "/#ia"]]],
    ["Conta", [["Entrar", "/login"], ["Criar conta", "/login?mode=signup"], ["Assinatura", "/assinatura"]]],
    ["Legal", [["Privacidade", "/#"], ["Termos", "/#"], ["LGPD", "/#"]]],
    ["Recursos", [["Documentação", "/#"], ["Status", "/#"], ["Contato", "/#"]]],
  ];
  return (
    <footer className="border-t border-hairline">
      <div className="mx-auto max-w-frame px-4 py-12">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-1">
            <Brand />
            <p className="mt-3 max-w-xs text-[14px] text-mute">
              Analytics, gestão e IA para o seu GitHub.
            </p>
          </div>
          {cols.map(([title, links]) => (
            <div key={title}>
              <div className="text-[14px] font-bold text-ink">{title}</div>
              <ul className="mt-3 space-y-2">
                {links.map(([label, href]) => (
                  <li key={label}>
                    <a href={href} className="text-[14px] text-mute hover:text-ink">{label}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-10 flex flex-col items-center justify-between gap-2 border-t border-hairline pt-6 text-[14px] text-mute sm:flex-row">
          <span>© {new Date().getFullYear()} {APP_NAME} · Linkium</span>
          <span>Feito com mono · sem gradientes · só conteúdo</span>
        </div>
      </div>
    </footer>
  );
}

/* ──────────────────────── Section primitives ──────────────────────── */
export function SectionLabel({ children, id }: { children: React.ReactNode; id?: string }) {
  return (
    <h2 id={id} className="scroll-mt-20 border-b border-hairline pb-3 text-heading-md text-ink">
      {children}
    </h2>
  );
}

/** Linha de feature com marcador ASCII [+]/[-]/[x] (DESIGN.md list-row). */
export function ListRow({
  marker = "+",
  label,
  desc,
}: {
  marker?: "+" | "-" | "x";
  label: string;
  desc?: string;
}) {
  return (
    <div className="flex gap-3 py-2 text-body-md">
      <span className="ascii-marker text-ink">[{marker}]</span>
      <span className="text-ink">
        <b className="font-bold">{label}</b>
        {desc ? <span className="text-body"> — {desc}</span> : null}
      </span>
    </div>
  );
}

/* ─────────────────── Sparkline ASCII (sem libs pesadas) ─────────────── */
export function Sparkline({ data, caption }: { data: number[]; caption?: string }) {
  const blocks = "▁▂▃▄▅▆▇█";
  const max = Math.max(...data, 1);
  const line = data.map((v) => blocks[Math.min(blocks.length - 1, Math.round((v / max) * (blocks.length - 1)))]).join("");
  return (
    <div className="text-[14px]">
      <div className="truncate font-bold tracking-tight text-ink" aria-hidden>{line}</div>
      {caption && <div className="mt-1 text-mute">{caption}</div>}
    </div>
  );
}
