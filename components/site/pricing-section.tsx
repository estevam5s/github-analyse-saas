"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { CycleToggle, PlanCards, type Plan } from "./plan-cards";

export function PricingSection({ plans }: { plans: Plan[] }) {
  const router = useRouter();
  const [cycle, setCycle] = React.useState<"month" | "year">("month");
  return (
    <div>
      <div className="mb-8 flex justify-center">
        <CycleToggle cycle={cycle} setCycle={setCycle} />
      </div>
      <PlanCards
        plans={plans}
        cycle={cycle}
        onSelect={(slug) => router.push(`/login?mode=signup&plan=${slug}`)}
        ctaLabel={(p) => (p.slug === "free" ? "Começar grátis" : "Assinar")}
      />
      <p className="mt-6 text-center text-[13px] text-mute">
        Pagamento seguro via Stripe · 7 dias grátis no Pro · reembolso de 7 dias · sem cobrança por GB
      </p>
    </div>
  );
}
