import Link from "next/link";

import { ArrowLeft } from "lucide-react";

import { Brand } from "@/components/site/marketing";

/** Cabeçalho leve para páginas protegidas fora do shell do dashboard. */
export function TopReturn() {
  return (
    <header className="border-b border-hairline">
      <div className="mx-auto flex h-14 max-w-content items-center justify-between px-4">
        <Brand />
        <Link href="/dashboard" className="inline-flex items-center gap-1 text-[14px] text-mute hover:text-ink">
          <ArrowLeft className="size-4" /> Voltar ao painel
        </Link>
      </div>
    </header>
  );
}
