"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

export function DisconnectGitHub() {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);
  return (
    <button
      onClick={async () => {
        if (!confirm("Desconectar a conta GitHub?")) return;
        setBusy(true);
        await fetch("/api/gh/connect", { method: "DELETE" });
        setBusy(false);
        router.refresh();
      }}
      disabled={busy}
      className="rounded-sm border border-hairline-strong px-3 py-1.5 text-[13px] text-mute hover:text-ink"
    >
      {busy ? "removendo…" : "Desconectar"}
    </button>
  );
}
