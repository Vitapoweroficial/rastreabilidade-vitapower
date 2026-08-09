import { LogOut, ShieldCheck } from "lucide-react";
import type { WorkspaceMember } from "@/lib/workspace-members";
import { logoutAction } from "@/app/login/actions";

export function WorkspaceUserMenu({ member }: { member: WorkspaceMember }) {
  return (
    <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-3">
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-950 text-sm font-black text-white">{member.name.slice(0, 2).toUpperCase()}</div>
        <div className="min-w-0 flex-1"><p className="truncate text-sm font-black text-slate-950">{member.name}</p><p className="truncate text-xs font-semibold text-slate-500">{member.role}</p></div>
        {member.accessLevel === "admin" ? <ShieldCheck size={17} className="shrink-0 text-red-700" /> : null}
      </div>
      <form action={logoutAction} className="mt-3"><button type="submit" className="flex min-h-9 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-xs font-black text-slate-600 transition hover:border-red-200 hover:text-red-700"><LogOut size={14} /> Sair</button></form>
    </div>
  );
}
