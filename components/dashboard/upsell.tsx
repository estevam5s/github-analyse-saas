import Link from "next/link";

export function Upsell({ feature, plan }: { feature: string; plan?: string }) {
  return (
    <div className="rounded-sm border border-hairline bg-surface-soft p-8 text-center">
      <span className="ascii-marker text-[28px] text-ash">[ - ]</span>
      <h3 className="mt-3 text-[18px] font-bold text-ink">{feature} não está no seu plano</h3>
      <p className="mx-auto mt-1 max-w-md text-[14px] text-mute">
        Faça upgrade para desbloquear este recurso e elevar seus analytics e automações com IA.
      </p>
      <Link
        href="/assinatura"
        className="mt-5 inline-flex h-9 items-center rounded-sm bg-ink px-5 text-[14px] font-medium text-canvas hover:bg-ink-deep"
      >
        Ver planos
      </Link>
    </div>
  );
}
