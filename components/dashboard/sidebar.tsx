"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  BarChart3,
  Bot,
  Building2,
  CreditCard,
  GitBranch,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  Shield,
  X,
} from "lucide-react";

import { Brand } from "@/components/site/marketing";
import { cn } from "@/lib/utils";

type Item = { href: string; label: string; icon: React.ElementType; locked?: boolean };

export function Sidebar({ plan, isAdmin }: { plan: string; isAdmin: boolean }) {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);

  const items: Item[] = [
    { href: "/dashboard", label: "Visão geral", icon: LayoutDashboard },
    { href: "/dashboard/repositorios", label: "Repositórios", icon: GitBranch },
    { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
    { href: "/dashboard/ia", label: "Inteligência IA", icon: Bot },
    { href: "/dashboard/organizacao", label: "Organização", icon: Building2 },
  ];
  const footerItems: Item[] = [
    { href: "/assinatura", label: "Assinatura", icon: CreditCard },
    { href: "/conta", label: "Conta", icon: Settings },
  ];
  if (isAdmin) footerItems.push({ href: "/admin", label: "Admin", icon: Shield });

  const NavLink = ({ it }: { it: Item }) => {
    const active = pathname === it.href || (it.href !== "/dashboard" && pathname.startsWith(it.href));
    return (
      <Link
        href={it.href}
        onClick={() => setOpen(false)}
        className={cn(
          "flex items-center gap-2.5 rounded-sm px-3 py-2 text-[14px] transition-colors",
          active ? "bg-ink text-canvas" : "text-charcoal hover:bg-surface-card",
        )}
      >
        <it.icon className="size-4" />
        {it.label}
      </Link>
    );
  };

  return (
    <>
      {/* mobile topbar */}
      <div className="flex items-center justify-between border-b border-hairline px-4 py-3 lg:hidden">
        <Brand />
        <button onClick={() => setOpen(true)} aria-label="Abrir menu" className="text-ink">
          <Menu className="size-5" />
        </button>
      </div>

      {/* overlay mobile */}
      {open && <div className="fixed inset-0 z-40 bg-ink/30 lg:hidden" onClick={() => setOpen(false)} />}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-hairline bg-canvas px-3 py-4 transition-transform lg:static lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between px-2">
          <Brand />
          <button onClick={() => setOpen(false)} className="text-mute lg:hidden" aria-label="Fechar menu">
            <X className="size-5" />
          </button>
        </div>

        <div className="mx-2 mt-4 flex items-center justify-between rounded-sm border border-hairline px-3 py-2 text-[12px]">
          <span className="text-mute">plano</span>
          <span className="font-bold uppercase text-ink">{plan}</span>
        </div>

        <nav className="mt-4 flex flex-1 flex-col gap-1">
          {items.map((it) => <NavLink key={it.href} it={it} />)}
          <div className="my-3 border-t border-hairline" />
          {footerItems.map((it) => <NavLink key={it.href} it={it} />)}
        </nav>

        <form action="/auth/signout" method="post" className="mt-2">
          <button
            type="submit"
            className="flex w-full items-center gap-2.5 rounded-sm px-3 py-2 text-[14px] text-mute hover:bg-surface-card hover:text-ink"
          >
            <LogOut className="size-4" /> Sair
          </button>
        </form>
      </aside>
    </>
  );
}
