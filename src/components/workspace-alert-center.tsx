"use client";

import Link from "next/link";
import { Bell, Check, CheckCheck, ChevronRight, ClipboardCheck, Clock3, Sparkles, UserRound } from "lucide-react";
import { useMemo, useState, useTransition } from "react";

export type WorkspaceTaskStatus = "novo" | "em_andamento" | "aguardando_cliente" | "concluido";

export type WorkspaceAlertView = {
  id: number;
  sourceKey: string;
  type: string;
  audience: string;
  title: string;
  message: string;
  href: string | null;
  entityType: string | null;
  entityId: number | null;
  readAt: string | null;
  taskStatus: WorkspaceTaskStatus;
  assignee: string | null;
  assigneeMemberId: number | null;
  dueAt: string | null;
  acceptedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

function relativeTime(value: string) {
  const date = new Date(value);
  const seconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  if (seconds < 60) return "agora";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `há ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `há ${hours} h`;
  const days = Math.floor(hours / 24);
  return `há ${days} d`;
}

function taskStatusLabel(value: WorkspaceTaskStatus) {
  if (value === "em_andamento") return "Em andamento";
  if (value === "aguardando_cliente") return "Aguardando cliente";
  if (value === "concluido") return "Concluído";
  return "Novo";
}

function dueLabel(value: string | null) {
  if (!value) return "Sem prazo";
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

export function WorkspaceAlertCenter({ initialAlerts, initialUnreadCount, initialOpenTaskCount }: { initialAlerts: WorkspaceAlertView[]; initialUnreadCount: number; initialOpenTaskCount: number }) {
  const [open, setOpen] = useState(false);
  const [alerts, setAlerts] = useState(initialAlerts);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const [isPending, startTransition] = useTransition();

  const unreadAlerts = useMemo(() => alerts.filter((alert) => !alert.readAt), [alerts]);
  const latestUnread = unreadAlerts[0] ?? null;
  const localOpenTaskCount = useMemo(() => {
    const visibleOpen = alerts.filter((alert) => alert.taskStatus !== "concluido").length;
    return Math.max(visibleOpen, initialOpenTaskCount);
  }, [alerts, initialOpenTaskCount]);

  async function markRead(alertId: number) {
    const current = alerts.find((alert) => alert.id === alertId);
    if (!current || current.readAt) return;
    setAlerts((items) => items.map((alert) => alert.id === alertId ? { ...alert, readAt: new Date().toISOString() } : alert));
    setUnreadCount((count) => Math.max(0, count - 1));
    await fetch("/api/workspace/alerts", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ alertId, action: "read" }) });
  }

  function markAll() {
    startTransition(async () => {
      setAlerts((items) => items.map((alert) => ({ ...alert, readAt: alert.readAt ?? new Date().toISOString() })));
      setUnreadCount(0);
      await fetch("/api/workspace/alerts", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ all: true }) });
    });
  }

  return (
    <div className="relative mb-5">
      {latestUnread ? (
        <div className="mb-3 flex flex-col gap-3 rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-100 text-amber-700"><Sparkles size={18} /></div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2"><span className="text-xs font-black uppercase tracking-[0.14em] text-amber-700">Novo briefing</span><span className="rounded-full bg-slate-950 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-white">{latestUnread.audience}</span></div>
              <p className="mt-1 font-black text-slate-950">{latestUnread.title}</p>
              <p className="mt-1 text-sm text-slate-600">{latestUnread.message}</p>
              <div className="mt-2 flex flex-wrap gap-3 text-xs font-bold text-slate-500">
                <span className="inline-flex items-center gap-1"><UserRound size={13} /> {latestUnread.assignee ?? "Sem responsável"}</span>
                <span className="inline-flex items-center gap-1"><Clock3 size={13} /> {dueLabel(latestUnread.dueAt)}</span>
                <span>{taskStatusLabel(latestUnread.taskStatus)}</span>
              </div>
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <button type="button" className="btn-secondary" onClick={() => markRead(latestUnread.id)}><Check size={15} /> Visto</button>
            <Link href="/admin/tarefas" className="btn-secondary"><ClipboardCheck size={15} /> Atribuir</Link>
            {latestUnread.href ? <Link href={latestUnread.href} className="btn-primary" onClick={() => void markRead(latestUnread.id)}>Abrir DNA <ChevronRight size={16} /></Link> : null}
          </div>
        </div>
      ) : null}

      <div className="flex justify-end gap-2">
        <Link href="/admin/tarefas" className="relative inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-black text-slate-700 shadow-sm transition hover:border-red-200 hover:text-red-700">
          <ClipboardCheck size={17} /> Tarefas
          {localOpenTaskCount > 0 ? <span className="grid min-w-5 place-items-center rounded-full bg-slate-950 px-1.5 py-0.5 text-[10px] font-black text-white">{localOpenTaskCount > 99 ? "99+" : localOpenTaskCount}</span> : null}
        </Link>
        <button type="button" onClick={() => setOpen((value) => !value)} className="relative inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-black text-slate-700 shadow-sm transition hover:border-red-200 hover:text-red-700">
          <Bell size={17} /> Alertas
          {unreadCount > 0 ? <span className="grid min-w-5 place-items-center rounded-full bg-red-600 px-1.5 py-0.5 text-[10px] font-black text-white">{unreadCount > 99 ? "99+" : unreadCount}</span> : null}
        </button>
      </div>

      {open ? (
        <div className="absolute right-0 top-12 z-40 w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.18)]">
          <div className="flex items-center justify-between border-b border-slate-100 p-4"><div><p className="font-black text-slate-950">Central de alertas</p><p className="text-xs font-semibold text-slate-500">Comercial + Engenharia</p></div>{unreadCount ? <button type="button" onClick={markAll} disabled={isPending} className="inline-flex items-center gap-1.5 text-xs font-black text-red-700"><CheckCheck size={15} /> Marcar todos</button> : null}</div>
          <div className="max-h-[440px] overflow-y-auto p-2">
            {alerts.length === 0 ? <div className="p-7 text-center text-sm font-semibold text-slate-500">Nenhum alerta por enquanto.</div> : alerts.map((alert) => (
              <div key={alert.id} className={`rounded-xl p-3 transition ${alert.readAt ? "bg-white" : "bg-red-50/70"}`}>
                <div className="flex items-start gap-3">
                  <div className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${alert.readAt ? "bg-slate-300" : "bg-red-600"}`} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2"><p className="font-black text-slate-950">{alert.title}</p><span className="text-[10px] font-black uppercase tracking-wide text-slate-400">{relativeTime(alert.createdAt)}</span></div>
                    <p className="mt-1 text-sm leading-5 text-slate-600">{alert.message}</p>
                    <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[10px] font-black uppercase tracking-[0.1em] text-slate-500"><span>{taskStatusLabel(alert.taskStatus)}</span><span>{alert.assignee ?? "Sem responsável"}</span><span>{dueLabel(alert.dueAt)}</span></div>
                    <div className="mt-2 flex items-center justify-between gap-3"><span className="text-[10px] font-black uppercase tracking-[0.13em] text-red-700">{alert.audience}</span><div className="flex items-center gap-3"><Link href="/admin/tarefas" className="text-xs font-black text-slate-700">Tarefa</Link>{alert.href ? <Link href={alert.href} onClick={() => void markRead(alert.id)} className="text-xs font-black text-red-700">Abrir DNA</Link> : null}</div></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
