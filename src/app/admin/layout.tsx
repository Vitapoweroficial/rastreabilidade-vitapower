import { AdminNav } from "@/components/admin-nav";
import { WorkspaceAlertCenter } from "@/components/workspace-alert-center";
import { WorkspaceUserMenu } from "@/components/workspace-user-menu";
import { getOpenWorkspaceTaskCount, getUnreadWorkspaceAlertCount, listWorkspaceAlerts } from "@/lib/workspace-alerts";
import { requireWorkspaceSession } from "@/lib/workspace-auth";
import { workspaceModules } from "@/lib/workspace-members";

export default async function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const session = await requireWorkspaceSession();
  const member = session.member;
  const allowedModules = member.accessLevel === "admin" ? workspaceModules.map((item) => item.id) : member.permissions;
  const canSeeTasks = allowedModules.includes("tarefas");
  const [alerts, unreadCount, openTaskCount] = canSeeTasks
    ? await Promise.all([listWorkspaceAlerts(15), getUnreadWorkspaceAlertCount(), getOpenWorkspaceTaskCount()])
    : [[], 0, 0];

  return (
    <div className="min-h-screen bg-[#f4f5f7] text-ink">
      <div className="mx-auto grid min-h-screen max-w-[1540px] grid-cols-1 lg:grid-cols-[296px_1fr]">
        <aside className="sticky top-0 z-20 border-b border-line bg-white/95 px-5 py-5 backdrop-blur lg:h-screen lg:border-b-0 lg:border-r">
          <div className="mb-7 flex items-center gap-3 rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-950 to-red-950 p-4 text-white shadow-soft">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-700 text-sm font-black tracking-tight">VP</div>
            <div><p className="text-sm font-black uppercase tracking-[0.18em] text-red-100">Vita Power</p><p className="text-base font-black">VITA OS</p><p className="text-xs font-semibold text-slate-300">Workspace industrial</p></div>
          </div>
          <AdminNav allowedModules={allowedModules} />
          <WorkspaceUserMenu member={member} />
        </aside>
        <main className="px-5 py-6 sm:px-8 lg:px-10">
          {canSeeTasks ? <WorkspaceAlertCenter initialAlerts={alerts} initialUnreadCount={unreadCount} initialOpenTaskCount={openTaskCount} /> : null}
          {children}
        </main>
      </div>
    </div>
  );
}
