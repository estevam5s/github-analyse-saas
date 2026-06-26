import { cn } from "@/lib/utils";

/* Bloco com borda hairline (não há cards elevados no DESIGN.md). */
export function Panel({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("rounded-sm border border-hairline bg-canvas", className)}>{children}</div>;
}

export function PanelHeader({ title, action, hint }: { title: string; action?: React.ReactNode; hint?: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-hairline px-4 py-3">
      <div>
        <h3 className="text-[15px] font-bold text-ink">{title}</h3>
        {hint && <p className="text-[12px] text-mute">{hint}</p>}
      </div>
      {action}
    </div>
  );
}

/* KPI estilo terminal: rótulo + valor mono grande. */
export function Stat({ label, value, sub }: { label: string; value: React.ReactNode; sub?: string }) {
  return (
    <div className="rounded-sm border border-hairline p-4">
      <div className="text-[12px] uppercase tracking-wide text-mute">{label}</div>
      <div className="mt-1 text-[26px] font-bold leading-none tabular-nums text-ink">{value}</div>
      {sub && <div className="mt-1 text-[12px] text-mute">{sub}</div>}
    </div>
  );
}

export function PageTitle({ title, desc, children }: { title: string; desc?: string; children?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-[24px] font-bold tracking-tight text-ink">{title}</h1>
        {desc && <p className="mt-1 text-[14px] text-mute">{desc}</p>}
      </div>
      {children}
    </div>
  );
}

export function Empty({ title, hint, action }: { title: string; hint?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-sm border border-hairline px-6 py-16 text-center">
      <span className="ascii-marker text-[28px] text-ash">[ ]</span>
      <p className="font-bold text-ink">{title}</p>
      {hint && <p className="max-w-sm text-[14px] text-mute">{hint}</p>}
      {action}
    </div>
  );
}

/** Barra de proporção em blocos ASCII para linguagens/uso. */
export function BarRow({ label, value, max, suffix }: { label: string; value: number; max: number; suffix?: string }) {
  const pct = Math.min(100, Math.round((value / (max || 1)) * 100));
  const filled = Math.round((pct / 100) * 24);
  return (
    <div className="flex items-center gap-3 py-1 text-[13px]">
      <span className="w-28 shrink-0 truncate text-charcoal">{label}</span>
      <span className="font-bold tracking-tight text-ink" aria-hidden>
        {"█".repeat(filled)}
        <span className="text-ash">{"░".repeat(24 - filled)}</span>
      </span>
      <span className="ml-auto tabular-nums text-mute">{suffix ?? `${pct}%`}</span>
    </div>
  );
}
