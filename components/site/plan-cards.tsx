"use client";

import * as React from "react";

import { brl } from "@/lib/utils";

export type Plan = {
  slug: string;
  name: string;
  description?: string;
  price_month: number;
  price_year: number;
  features: string[];
  highlighted: boolean;
};

export function CycleToggle({ cycle, setCycle }: { cycle: "month" | "year"; setCycle: (c: "month" | "year") => void }) {
  return (
    <div className="inline-flex items-center rounded-sm border border-hairline-strong">
      {(["month", "year"] as const).map((c) => (
        <button
          key={c}
          onClick={() => setCycle(c)}
          className={`px-4 py-1.5 text-[14px] font-medium transition-colors ${
            cycle === c ? "bg-ink text-canvas" : "text-mute hover:text-ink"
          }`}
        >
          {c === "month" ? "Mensal" : "Anual −20%"}
        </button>
      ))}
    </div>
  );
}

export function PlanCards({
  plans,
  cycle,
  currentSlug,
  onSelect,
  busy,
  ctaLabel,
}: {
  plans: Plan[];
  cycle: "month" | "year";
  currentSlug?: string;
  onSelect?: (slug: string) => void;
  busy?: string | null;
  ctaLabel?: (p: Plan) => string;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
      {plans.map((p) => {
        const price = cycle === "year" ? p.price_year : p.price_month;
        const free = p.slug === "free";
        const isCurrent = currentSlug === p.slug;
        const perMonth = cycle === "year" ? Math.round(price / 12) : price;
        return (
          <div
            key={p.slug}
            className={`flex flex-col rounded-sm border p-5 ${
              p.highlighted ? "border-ink" : "border-hairline"
            }`}
          >
            {p.highlighted && (
              <div className="mb-3 -mt-1 inline-flex w-fit rounded-sm bg-ink px-2 py-0.5 text-[12px] font-medium text-canvas">
                mais popular
              </div>
            )}
            <h3 className="text-[18px] font-bold text-ink">{p.name}</h3>
            {p.description && <p className="mt-1 text-[13px] text-mute">{p.description}</p>}
            <div className="mt-4 flex items-end gap-1">
              <span className="text-[28px] font-bold leading-none text-ink">{free ? "R$ 0" : brl(perMonth)}</span>
              {!free && <span className="mb-1 text-[13px] text-mute">/mês</span>}
            </div>
            {!free && cycle === "year" && (
              <p className="mt-1 text-[12px] text-mute">{brl(price)} cobrado anualmente</p>
            )}
            {free && <p className="mt-1 text-[12px] text-mute">trial Pro de 7 dias incluso</p>}

            {onSelect && (
              <button
                onClick={() => onSelect(p.slug)}
                disabled={isCurrent || busy === p.slug}
                className={`mt-4 h-9 w-full rounded-sm text-[14px] font-medium transition-colors disabled:opacity-60 ${
                  isCurrent
                    ? "border border-hairline-strong text-mute"
                    : p.highlighted
                      ? "bg-ink text-canvas hover:bg-ink-deep"
                      : "border border-hairline-strong text-ink hover:bg-surface-soft"
                }`}
              >
                {busy === p.slug ? "aguarde…" : isCurrent ? "Plano atual" : ctaLabel ? ctaLabel(p) : free ? "Começar" : "Assinar"}
              </button>
            )}

            <ul className="mt-5 flex-1 space-y-2 text-[14px]">
              {p.features.map((f) => (
                <li key={f} className="flex gap-2 text-body">
                  <span className="ascii-marker text-ink">[+]</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
