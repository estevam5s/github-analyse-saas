/**
 * hero-tui-mockup (DESIGN.md): única superfície escura por página.
 * Faux terminal mostrando uma análise de repositório — sem fotos, só texto.
 */
const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "GitAnalytica";

export function TuiMockup() {
  return (
    <div className="rounded-sm bg-surface-dark px-6 py-8 text-canvas sm:px-10 sm:py-10">
      {/* barra superior */}
      <div className="mb-6 flex items-center gap-2 text-ash">
        <span className="size-2.5 rounded-full bg-danger/80" />
        <span className="size-2.5 rounded-full bg-warning/80" />
        <span className="size-2.5 rounded-full bg-success/80" />
        <span className="ml-3 text-[13px]">{APP_NAME.toLowerCase()} — terminal</span>
      </div>

      {/* prompt */}
      <div className="rounded-sm bg-surface-dark-elevated px-3 py-2 text-[14px] sm:text-[15px]">
        <span className="text-success">$</span> gha analyze{" "}
        <span className="text-accent">estevam5s/portfolio</span>{" "}
        <span className="text-ash">--ai</span>
        <span className="ml-0.5 inline-block h-4 w-2 animate-blink bg-canvas align-middle" aria-hidden />
      </div>

      {/* saída */}
      <div className="mt-5 space-y-1.5 text-[13px] leading-relaxed sm:text-[14px]">
        <Line m="+" c="text-success">commits         <b>1.243</b>   <span className="text-ash">▁▂▃▅▇▆▄ últimos 12 meses</span></Line>
        <Line m="+" c="text-success">pull requests    <b>87%</b>    <span className="text-ash">merge rate · lead time 1.4d</span></Line>
        <Line m="+" c="text-success">contributors      <b>9</b>     <span className="text-ash">bus factor saudável</span></Line>
        <Line m="x" c="text-warning">code score      <b>A+ 92</b>   <span className="text-ash">2 riscos médios detectados</span></Line>
        <Line m="-" c="text-danger">vulnerabilidade  <b>1 alta</b>  <span className="text-ash">dependência desatualizada</span></Line>
        <div className="pt-3 text-ash">
          <span className="text-accent">▸ IA</span> README gerado · arquitetura avaliada · review pronto
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-x-6 gap-y-1 border-t border-white/10 pt-4 text-[12px] text-ash">
        <span>tab alternar repo</span>
        <span>ctrl-p comandos</span>
        <span>⌘K busca</span>
      </div>
    </div>
  );
}

function Line({ m, c, children }: { m: string; c: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-2">
      <span className={`${c} font-bold`}>[{m}]</span>
      <span className="text-canvas/90">{children}</span>
    </div>
  );
}
