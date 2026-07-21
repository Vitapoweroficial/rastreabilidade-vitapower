"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Beaker, Bot, Boxes, PackageCheck, UsersRound } from "lucide-react";

const items = [
  { href: "/admin", label: "Dashboard", icon: BarChart3 },
  { href: "/admin/clientes", label: "Clientes", icon: UsersRound },
  { href: "/admin/produtos", label: "Produtos", icon: Boxes },
  { href: "/admin/engenharia", label: "Engenharia", icon: Beaker },
  { href: "/admin/lotes", label: "Lotes", icon: PackageCheck },
  { href: "/admin/vita-ia", label: "VITA IA", icon: Bot }
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-2 overflow-x-auto lg:flex-col lg:overflow-visible">
      {items.map((item) => {
        const Icon = item.icon;
        const active = item.href === "/admin" ? pathname === item.href : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={[
              "flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-black transition",
              active ? "bg-moss text-white" : "text-slate-600 hover:bg-mist hover:text-moss"
            ].join(" ")}
          >
            <Icon size={18} aria-hidden="true" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
