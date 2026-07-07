"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { workspaceModules } from "@/lib/workspace";

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-2 overflow-x-auto lg:flex-col lg:overflow-visible">
      {workspaceModules.map((item) => {
        const Icon = item.icon;
        const active = item.href === "/admin" ? pathname === item.href : pathname.startsWith(item.href);

        return (
          <Link
            key={item.slug}
            href={item.href}
            className={[
              "group flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-black transition",
              active
                ? "bg-red-700 text-white shadow-[0_14px_30px_rgba(185,28,28,0.22)]"
                : "text-slate-600 hover:bg-slate-100 hover:text-red-700"
            ].join(" ")}
          >
            <Icon size={18} aria-hidden="true" />
            <span className="whitespace-nowrap">{item.shortLabel}</span>
          </Link>
        );
      })}
    </nav>
  );
}
