"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, ChevronRight, Clock3, Filter, Save, Search, UserRound, UsersRound } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import type { WorkspaceAlertView } from "@/components/workspace-alert-center";
import type { WorkspaceMember } from "@/lib/workspace-members";

type TaskStatus = "novo" | "em_andamento" | "aguardando_cliente" | "concluido";

const statusOptions: { value: TaskStatus; label: string }[] = [
  { value: "novo", label: "Novo" },
  { value: "em_andamento", label: "Em andamento" },
  { value: "aguardando_cliente", label: "Aguardando cliente" },
  { value: "concluido", label: "Concluído" }
];

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function dateInputValue(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

function statusLabel(status: TaskStatus) {
  return statusOptions.find((item) => item.value === status)?.label ?? status;
}

function statusTone(status: TaskStatus) {
  if (status === "concluido") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (status === "em_andamento") return "border-blue-200 bg-blue-50 text-blue-700";
  if (status === "aguardando_cliente") return "border-amber-200 bg-amber-50 text-amber-700";
  return "border-red-200 bg-red-50 text-red-700";
}

function isOverdue(task: WorkspaceAlertView) {
  return Boolean(task.dueAt && task.taskStatus !== "concluido" && new Date(task.dueAt).getTime() < Date.now());
}

export function WorkspaceTaskBoard({ initialTasks, members }: { initialTasks: WorkspaceAlertView[]; members: WorkspaceMember[] }) {
  const searchParams = useSearchParams();
  const requestedMember = searchParams.get("responsavel");
  const initialMemberFilter = requestedMember && members.some((member) => String(member.id) === requestedMember) ? requestedMember : "todos";
  const [tasks, setTasks] = useState(initialTasks);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"abertas" | "todas" | TaskStatus>("abertas");
  const [memberFilter, setMemberFilter] = useState<"todos" | "sem_responsavel" | string>(initialMemberFilter);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const activeMembers = useMemo(() => members.filter((member) => member.active), [members]);

  const filtered = useMemo(() => {
    const term = normalize(query.trim());
    return tasks.filter((task) => {
      const matchesStatus = statusFilter === "todas" || (statusFilter === "abertas" ? task.taskStatus !== "concluido" : task.taskStatus === statusFilter);
      const matchesMember = memberFilter === "todos" || (memberFilter === "sem_responsavel" ? !task.assigneeMemberId : String(task.assigneeMemberId) === memberFilter);
      const haystack = normalize(`${task.title} ${task.message} ${task.audience} ${task.assignee ?? ""}`);
      return matchesStatus && matchesMember && (!term || haystack.includes(term));
    });
  }, [memberFilter, query, statusFilter, tasks]);

  const counters = useMemo(() => ({
    abertas: tasks.filter((task) => task.taskStatus !== "concluido").length,
    vencidas: tasks.filter(isOverdue).length,
    andamento: tasks.filter((task) => task.taskStatus === "em_andamento").length,
    semDono: tasks.filter((task) => task.taskStatus !== "concluido" && !task.assigneeMemberId).length
  }), [tasks]);

  function patchLocal(id: number, patch: Partial<WorkspaceAlertView>) {
    setTasks((items) => items.map((task) => task.id === id ? { ...task, ...patch } : task));
  }

  function assignMember(taskId: number, memberId: number | null) {
    const member = memberId ? activeMembers.find((item) => item.id === memberId) : null;
    patchLocal(taskId, { assigneeMemberId: member?.id ?? null, assignee: member?.name ?? null });
  }

  async function saveTask(task: WorkspaceAlertView) {
    setSavingId(task.id);
    setMessage(null);
    try {
      const response = await fetch("/api/workspace/alerts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          alertId: task.id,
          action: "task",
          taskStatus: task.taskStatus,
          assigneeMemberId: task.assigneeMemberId,
          dueAt: task.dueAt
        })
      });
      const payload = await response.json() as { ok: boolean; error?: string; task?: WorkspaceAlertView };
      if (!response.ok || !payload.ok || !payload.task) throw new Error(payload.error || "Não foi possível salvar a tarefa.");
      patchLocal(task.id, payload.task);
      setMessage("Tarefa atualizada.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível salvar a tarefa.");
    } finally {
      setSavingId(null);
    }
  }

  function quickStatus(task: WorkspaceAlertView, status: TaskStatus) {
    patchLocal(task.id, { taskStatus: status });
    startTransition(async () => {
      const response = await fetch("/api/workspace/alerts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alertId: task.id, action: "task", taskStatus: status })
      });
      const payload = await response.json() as { ok: boolean; task?: WorkspaceAlertView };
      if (response.ok && payload.ok && payload.task) patchLocal(task.id, payload.task);
    });
  }

  return (
    <div className="space-y-6 pb-8">
      <section className="overflow-hidden rounded-[28px] border border-slate-800 bg-slate-950 p-6 text-white shadow-[0_28px_80px_rgba(15,23,42,0.24)] sm:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-red-200">Execução Private Label</p>
            <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Nenhum briefing sem dono.</h1>
            <p className="mt-3 max-w-3xl text-slate-300">Cada briefing vira uma tarefa ligada a um colaborador cadastrado, com prazo, status e visão individual da carga de trabalho.</p>
          </div>
          <Link href="/admin/equipe" className="btn-secondary border-white/15 bg-white/10 text-white hover:bg-white/20"><UsersRound size={16} /> Gerenciar equipe</Link>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Tarefas abertas" value={counters.abertas} icon={Filter} />
        <Metric label="Vencidas" value={counters.vencidas} icon={Clock3} danger={counters.vencidas > 0} />
        <Metric label="Em andamento" value={counters.andamento} icon={UserRound} />
        <Metric label="Sem responsável" value={counters.semDono} icon={UsersRound} danger={counters.semDono > 0} />
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 xl:grid-cols-[1fr_auto_auto] xl:items-center">
          <div className="relative">
            <Search size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar cliente, projeto, produto ou responsável..." className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm font-semibold outline-none focus:border-red-300 focus:bg-white focus:ring-4 focus:ring-red-100" />
          </div>
          <select value={memberFilter} onChange={(event) => setMemberFilter(event.target.value)} className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-black text-slate-700 outline-none focus:border-red-300 focus:ring-4 focus:ring-red-100">
            <option value="todos">Toda a equipe</option>
            <option value="sem_responsavel">Sem responsável</option>
            {activeMembers.map((member) => <option key={member.id} value={String(member.id)}>{member.name} · {member.department}</option>)}
          </select>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)} className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-black text-slate-700 outline-none focus:border-red-300 focus:ring-4 focus:ring-red-100">
            <option value="abertas">Abertas</option>
            <option value="todas">Todas</option>
            {statusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </div>
        {memberFilter !== "todos" ? <div className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600">Visão individual ativa: {memberFilter === "sem_responsavel" ? "tarefas sem responsável" : activeMembers.find((member) => String(member.id) === memberFilter)?.name ?? "colaborador"}.</div> : null}
        {message ? <p className="mt-3 text-sm font-bold text-slate-600">{message}</p> : null}
      </section>

      <section className="space-y-4">
        {filtered.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm font-semibold text-slate-500">Nenhuma tarefa corresponde ao filtro atual.</div> : filtered.map((task) => {
          const overdue = isOverdue(task);
          return (
            <article key={task.id} className={`rounded-2xl border bg-white p-5 shadow-sm ${overdue ? "border-red-300 shadow-red-100" : "border-slate-200"}`}>
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full border px-2.5 py-1 text-[11px] font-black uppercase tracking-wide ${statusTone(task.taskStatus)}`}>{statusLabel(task.taskStatus)}</span>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-black uppercase tracking-wide text-slate-600">{task.audience}</span>
                    {overdue ? <span className="rounded-full bg-red-600 px-2.5 py-1 text-[11px] font-black uppercase tracking-wide text-white">Prazo vencido</span> : null}
                  </div>
                  <h2 className="mt-3 text-xl font-black text-slate-950">{task.title}</h2>
                  <p className="mt-1 text-sm leading-6 text-slate-600">{task.message}</p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  {task.taskStatus === "novo" ? <button type="button" onClick={() => quickStatus(task, "em_andamento")} disabled={isPending} className="btn-secondary">Iniciar</button> : null}
                  {task.taskStatus !== "concluido" ? <button type="button" onClick={() => quickStatus(task, "concluido")} disabled={isPending} className="btn-secondary"><CheckCircle2 size={15} /> Concluir</button> : null}
                  {task.href ? <Link href={task.href} className="btn-primary">Abrir DNA <ChevronRight size={16} /></Link> : null}
                </div>
              </div>

              <div className="mt-5 grid gap-4 border-t border-slate-100 pt-5 md:grid-cols-3">
                <label className="space-y-1.5"><span className="text-xs font-black uppercase tracking-wide text-slate-500">Responsável</span><select value={task.assigneeMemberId ? String(task.assigneeMemberId) : ""} onChange={(event) => assignMember(task.id, event.target.value ? Number(event.target.value) : null)} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold outline-none focus:border-red-300 focus:ring-4 focus:ring-red-100"><option value="">Sem responsável</option>{activeMembers.map((member) => <option key={member.id} value={member.id}>{member.name} · {member.department}</option>)}</select></label>
                <label className="space-y-1.5"><span className="text-xs font-black uppercase tracking-wide text-slate-500">Prazo</span><input type="datetime-local" value={dateInputValue(task.dueAt)} onChange={(event) => patchLocal(task.id, { dueAt: event.target.value ? new Date(event.target.value).toISOString() : null })} className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-semibold outline-none focus:border-red-300 focus:ring-4 focus:ring-red-100" /></label>
                <label className="space-y-1.5"><span className="text-xs font-black uppercase tracking-wide text-slate-500">Status</span><select value={task.taskStatus} onChange={(event) => patchLocal(task.id, { taskStatus: event.target.value as TaskStatus })} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold outline-none focus:border-red-300 focus:ring-4 focus:ring-red-100">{statusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
              </div>

              <div className="mt-4 flex justify-end"><button type="button" onClick={() => saveTask(task)} disabled={savingId === task.id} className="btn-primary"><Save size={15} /> {savingId === task.id ? "Salvando..." : "Salvar tarefa"}</button></div>
            </article>
          );
        })}
      </section>
    </div>
  );
}

function Metric({ label, value, icon: Icon, danger = false }: { label: string; value: number; icon: typeof Filter; danger?: boolean }) {
  return <div className={`rounded-2xl border bg-white p-4 shadow-sm ${danger ? "border-red-300" : "border-slate-200"}`}><div className="flex items-center justify-between"><div className={`grid h-10 w-10 place-items-center rounded-xl ${danger ? "bg-red-600 text-white" : "bg-slate-950 text-white"}`}><Icon size={18} /></div><span className="text-2xl font-black text-slate-950">{value}</span></div><p className="mt-3 text-sm font-bold text-slate-600">{label}</p></div>;
}
