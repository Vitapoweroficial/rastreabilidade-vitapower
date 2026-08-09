"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Beaker, Boxes, ClipboardCheck, ClipboardList, PackageCheck, UsersRound, UserRoundCog } from "lucide-react";
import type { WorkspaceModuleId } from "@/lib/workspace-members";

const items: Array<{ href: string; label: string; icon: typeof BarChart3; module: WorkspaceModuleId }> = [
  { href: "/admin", label: "Dashboard", icon: BarChart3, module: "dashboard" },
  { href: "/admin/tarefas", label: "Tarefas", icon: ClipboardCheck, module: "tarefas" },
  { href: "/admin/equipe", label: "Equipe", icon: UserRoundCog, module: "equipe" },
  { href: "/admin/clientes", label: "Clientes", icon: UsersRound, module: "clientes" },
  { href: "/admin/produtos", label: "Produtos", icon: Boxes, module: "produtos" },
  { href: "/admin/engenharia", label: "Engenharia", icon: Beaker, module: "engenharia" },
  { href: "/admin/modulos/private-label", label: "Private Label", icon: ClipboardList, module: "private_label" },
  { href: "/admin/lotes", label: "Lotes", icon: PackageCheck, module: "lotes" }
];

export function AdminNav({ allowedModules }: { allowedModules: WorkspaceModuleId[] }) {
  const pathname = usePathname();
  const visibleItems = items.filter((item) => allowedModules.includes(item.module));

  return (
    <nav className="flex gap-2 overflow-x-auto lg:flex-col lg:overflow-visible">
      {visibleItems.map((item) => {
        const Icon = item.icon;
        const active = item.href === "/admin" ? pathname === item.href : pathname.startsWith(item.href);
        return (
          <Link key={item.href} href={item.href} className={["group flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-black transition", active ? "bg-red-700 text-white shadow-[0_14px_30px_rgba(185,28,28,0.22)]" : "text-slate-600 hover:bg-slate-100 hover:text-red-700"].join(" ")}>
            <Icon size={18} aria-hidden="true" /><span className="whitespace-nowrap">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
