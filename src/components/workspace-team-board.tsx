"use client";

import Link from "next/link";
import {
  Check,
  CheckCircle2,
  ChevronRight,
  Clipboard,
  Clock3,
  History,
  KeyRound,
  Plus,
  Save,
  ShieldCheck,
  UserRoundCheck,
  UsersRound
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  workspaceAccessLevels,
  workspaceModules,
  type WorkspaceAccessLevel,
  type WorkspaceMember,
  type WorkspaceModuleId
} from "@/lib/workspace-members";

type Draft = {
  name: string;
  email: string;
  department: string;
  role: string;
  accessLevel: WorkspaceAccessLevel;
  permissions: WorkspaceModuleId[];
  active: boolean;
};

type AccessState = { hasCredential: boolean; lastLoginAt: string | null };
type AuditEntry = { id: number; actorName: string | null; action: string; summary: string; createdAt: string };

const emptyDraft: Draft = {
  name: "",
  email: "",
  department: "",
  role: "",
  accessLevel: "membro",
  permissions: ["dashboard", "tarefas"],
  active: true
};

function accessLabel(value: WorkspaceAccessLevel) {
  if (value === "admin") return "Administrador";
  if (value === "gestor") return "Gestor";
  if (value === "leitura") return "Somente leitura";
  return "Membro";
}

function draftFromMember(member: WorkspaceMember): Draft {
  return {
    name: member.name,
    email: member.email ?? "",
    department: member.department,
    role: member.role,
    accessLevel: member.accessLevel,
    permissions: member.permissions,
    active: member.active
  };
}

function formatDate(value: string | null) {
  if (!value) return "Nunca acessou";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}

export function WorkspaceTeamBoard({
  initialMembers,
  openTaskCounts,
  accessStates,
  audit,
  canManage
}: {
  initialMembers: WorkspaceMember[];
  openTaskCounts: Record<string, number>;
  accessStates: Record<string, AccessState>;
  audit: AuditEntry[];
  canManage: boolean;
}) {
  const [members, setMembers] = useState(initialMembers);
  const [editingId, setEditingId] = useState<number | "new" | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [saving, setSaving] = useState(false);
  const [inviteBusyId, setInviteBusyId] = useState<number | null>(null);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const activeCount = useMemo(() => members.filter((member) => member.active).length, [members]);
  const managers = useMemo(() => members.filter((member) => member.active && ["admin", "gestor"].includes(member.accessLevel)).length, [members]);
  const enabledAccess = useMemo(() => members.filter((member) => accessStates[String(member.id)]?.hasCredential).length, [members, accessStates]);

  function startNew() {
    if (!canManage) return;
    setEditingId("new");
    setDraft(emptyDraft);
    setMessage(null);
    setInviteLink(null);
  }

  function startEdit(member: WorkspaceMember) {
    if (!canManage) return;
    setEditingId(member.id);
    setDraft(draftFromMember(member));
    setMessage(null);
    setInviteLink(null);
  }

  function togglePermission(permission: WorkspaceModuleId) {
    setDraft((current) => ({
      ...current,
      permissions: current.permissions.includes(permission)
        ? current.permissions.filter((item) => item !== permission)
        : [...current.permissions, permission]
    }));
  }

  async function save() {
    if (!canManage) return;
    setSaving(true);
    setMessage(null);
    setInviteLink(null);
    try {
      const isNew = editingId === "new";
      const response = await fetch("/api/workspace/members", {
        method: isNew ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...(isNew ? {} : { id: editingId }), ...draft, email: draft.email || null })
      });
      const payload = await response.json() as { ok: boolean; error?: string; member?: WorkspaceMember };
      if (!response.ok || !payload.ok || !payload.member) throw new Error(payload.error || "Não foi possível salvar o colaborador.");
      setMembers((items) => isNew
        ? [...items, payload.member!].sort((a, b) => a.name.localeCompare(b.name, "pt-BR"))
        : items.map((item) => item.id === payload.member!.id ? payload.member! : item));
      setEditingId(null);
      setMessage(isNew ? "Colaborador cadastrado. Agora defina o e-mail e gere o acesso." : "Colaborador atualizado.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível salvar o colaborador.");
    } finally {
      setSaving(false);
    }
  }

  async function generateInvite(member: WorkspaceMember) {
    setInviteBusyId(member.id);
    setMessage(null);
    setInviteLink(null);
    try {
      const response = await fetch("/api/workspace/members/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId: member.id })
      });
      const payload = await response.json() as { ok: boolean; error?: string; path?: string; expiresInHours?: number };
      if (!response.ok || !payload.ok || !payload.path) throw new Error(payload.error || "Não foi possível gerar o acesso.");
      const full = `${window.location.origin}${payload.path}`;
      setInviteLink(full);
      setMessage(`Link de acesso de ${member.name} criado. Ele expira em ${payload.expiresInHours ?? 72} horas e pode ser usado uma vez.`);
      await navigator.clipboard?.writeText(full).catch(() => undefined);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível gerar o acesso.");
    } finally {
      setInviteBusyId(null);
    }
  }

  async function copyInvite() {
    if (!inviteLink) return;
    await navigator.clipboard?.writeText(inviteLink).catch(() => undefined);
    setMessage("Link copiado. Envie apenas para o colaborador correto.");
  }

  return (
    <div className="space-y-6 pb-8">
      <section className="overflow-hidden rounded-[28px] border border-slate-800 bg-slate-950 p-6 text-white shadow-[0_28px_80px_rgba(15,23,42,0.24)] sm:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-red-200">Pessoas, acesso e governança</p>
            <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Equipe Vita Power no VITA OS.</h1>
            <p className="mt-3 max-w-3xl text-slate-300">Perfis reais, permissões por módulo, acesso individual, sessão protegida, tarefas por responsável e trilha de auditoria.</p>
          </div>
          {canManage ? <button type="button" onClick={startNew} className="btn-primary"><Plus size={16} /> Novo colaborador</button> : null}
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Colaboradores ativos" value={activeCount} icon={UsersRound} />
        <Metric label="Acessos ativados" value={enabledAccess} icon={KeyRound} />
        <Metric label="Gestores / admins" value={managers} icon={ShieldCheck} />
        <Metric label="Perfis configurados" value={members.length} icon={UserRoundCheck} />
      </section>

      {message ? <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm">{message}</div> : null}
      {inviteLink ? (
        <div className="flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0"><p className="text-xs font-black uppercase tracking-wide text-amber-800">Link secreto de ativação</p><p className="mt-1 break-all text-sm font-semibold text-slate-700">{inviteLink}</p></div>
          <button type="button" onClick={copyInvite} className="btn-secondary shrink-0"><Clipboard size={15} /> Copiar</button>
        </div>
      ) : null}

      {editingId !== null && canManage ? (
        <section className="rounded-2xl border border-red-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[0.16em] text-red-700">{editingId === "new" ? "Novo perfil" : "Editar perfil"}</p><h2 className="mt-1 text-xl font-black text-slate-950">{editingId === "new" ? "Cadastrar colaborador" : draft.name}</h2></div><button type="button" className="text-sm font-black text-slate-500" onClick={() => setEditingId(null)}>Cancelar</button></div>
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Field label="Nome"><input value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} className="field" placeholder="Nome do colaborador" /></Field>
            <Field label="E-mail corporativo"><input type="email" value={draft.email} onChange={(event) => setDraft((current) => ({ ...current, email: event.target.value }))} className="field" placeholder="nome@vitapower..." /></Field>
            <Field label="Área"><input value={draft.department} onChange={(event) => setDraft((current) => ({ ...current, department: event.target.value }))} className="field" placeholder="Comercial, Operações..." /></Field>
            <Field label="Função"><input value={draft.role} onChange={(event) => setDraft((current) => ({ ...current, role: event.target.value }))} className="field" placeholder="Cargo / função" /></Field>
            <Field label="Nível de acesso"><select value={draft.accessLevel} onChange={(event) => setDraft((current) => ({ ...current, accessLevel: event.target.value as WorkspaceAccessLevel }))} className="field">{workspaceAccessLevels.map((level) => <option key={level} value={level}>{accessLabel(level)}</option>)}</select></Field>
            <Field label="Status"><select value={draft.active ? "ativo" : "inativo"} onChange={(event) => setDraft((current) => ({ ...current, active: event.target.value === "ativo" }))} className="field"><option value="ativo">Ativo</option><option value="inativo">Inativo</option></select></Field>
          </div>
          <div className="mt-5"><p className="text-xs font-black uppercase tracking-wide text-slate-500">Módulos permitidos</p><div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">{workspaceModules.map((module) => { const checked = draft.permissions.includes(module.id); return <button key={module.id} type="button" onClick={() => togglePermission(module.id)} className={`flex items-center justify-between rounded-xl border px-3 py-3 text-left text-sm font-black transition ${checked ? "border-red-200 bg-red-50 text-red-800" : "border-slate-200 bg-white text-slate-600"}`}><span>{module.label}</span><span className={`grid h-5 w-5 place-items-center rounded-md ${checked ? "bg-red-600 text-white" : "bg-slate-100 text-transparent"}`}><Check size={13} /></span></button>; })}</div></div>
          <div className="mt-5 flex justify-end"><button type="button" onClick={save} disabled={saving} className="btn-primary"><Save size={16} /> {saving ? "Salvando..." : "Salvar perfil"}</button></div>
        </section>
      ) : null}

      <section className="grid gap-4 xl:grid-cols-2">
        {members.map((member) => {
          const tasks = openTaskCounts[String(member.id)] ?? 0;
          const access = accessStates[String(member.id)] ?? { hasCredential: false, lastLoginAt: null };
          return (
            <article key={member.id} className={`rounded-2xl border bg-white p-5 shadow-sm ${member.active ? "border-slate-200" : "border-slate-200 opacity-65"}`}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ${member.active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{member.active ? "Ativo" : "Inativo"}</span>
                    <span className="rounded-full bg-slate-950 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-white">{accessLabel(member.accessLevel)}</span>
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ${access.hasCredential ? "bg-blue-50 text-blue-700" : "bg-amber-50 text-amber-700"}`}>{access.hasCredential ? "Login ativado" : member.email ? "Aguardando ativação" : "Sem e-mail"}</span>
                  </div>
                  <h2 className="mt-3 text-xl font-black text-slate-950">{member.name}</h2>
                  <p className="mt-1 text-sm font-bold text-slate-600">{member.role}</p>
                  <p className="mt-1 text-xs text-slate-500">{member.department}{member.email ? ` · ${member.email}` : ""}</p>
                  <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500"><Clock3 size={13} /> Último acesso: {formatDate(access.lastLoginAt)}</p>
                </div>
                <div className="rounded-xl bg-slate-50 px-3 py-2 text-center"><p className="text-xl font-black text-slate-950">{tasks}</p><p className="text-[10px] font-black uppercase tracking-wide text-slate-500">abertas</p></div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">{member.permissions.map((permission) => <span key={permission} className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-slate-600">{workspaceModules.find((item) => item.id === permission)?.label ?? permission}</span>)}</div>
              <div className="mt-5 flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-4">
                {canManage ? <button type="button" onClick={() => startEdit(member)} className="btn-secondary">Editar perfil</button> : null}
                {canManage && member.active && member.email ? <button type="button" onClick={() => generateInvite(member)} disabled={inviteBusyId === member.id} className="btn-secondary"><KeyRound size={15} /> {inviteBusyId === member.id ? "Gerando..." : access.hasCredential ? "Redefinir acesso" : "Gerar acesso"}</button> : null}
                <Link href={`/admin/tarefas?responsavel=${member.id}`} className="btn-primary">Painel de tarefas <ChevronRight size={16} /></Link>
              </div>
            </article>
          );
        })}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-slate-950 text-white"><History size={18} /></div><div><p className="text-xs font-black uppercase tracking-[0.16em] text-red-700">Governança</p><h2 className="text-xl font-black text-slate-950">Trilha recente de auditoria</h2></div></div>
        <div className="mt-5 divide-y divide-slate-100">
          {audit.length === 0 ? <p className="py-5 text-sm font-semibold text-slate-500">As próximas ações relevantes aparecerão aqui.</p> : audit.map((entry) => <div key={entry.id} className="flex gap-3 py-3"><CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-600" /><div className="min-w-0 flex-1"><p className="text-sm font-bold text-slate-800">{entry.summary}</p><p className="mt-1 text-xs text-slate-400">{entry.actorName ?? "Sistema"} · {formatDate(entry.createdAt)} · {entry.action}</p></div></div>)}
        </div>
      </section>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="space-y-1.5"><span className="text-xs font-black uppercase tracking-wide text-slate-500">{label}</span>{children}</label>; }
function Metric({ label, value, icon: Icon }: { label: string; value: number; icon: typeof UsersRound }) { return <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex items-center justify-between"><div className="grid h-10 w-10 place-items-center rounded-xl bg-slate-950 text-white"><Icon size={18} /></div><span className="text-2xl font-black text-slate-950">{value}</span></div><p className="mt-3 text-sm font-bold text-slate-600">{label}</p></div>; }
