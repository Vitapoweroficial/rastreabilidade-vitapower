"use client";

import Link from "next/link";
import { Check, ChevronRight, Plus, Save, ShieldCheck, UserRoundCheck, UsersRound } from "lucide-react";
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

export function WorkspaceTeamBoard({ initialMembers, openTaskCounts }: { initialMembers: WorkspaceMember[]; openTaskCounts: Record<string, number> }) {
  const [members, setMembers] = useState(initialMembers);
  const [editingId, setEditingId] = useState<number | "new" | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const activeCount = useMemo(() => members.filter((member) => member.active).length, [members]);
  const managers = useMemo(() => members.filter((member) => member.active && ["admin", "gestor"].includes(member.accessLevel)).length, [members]);

  function startNew() {
    setEditingId("new");
    setDraft(emptyDraft);
    setMessage(null);
  }

  function startEdit(member: WorkspaceMember) {
    setEditingId(member.id);
    setDraft(draftFromMember(member));
    setMessage(null);
  }

  function togglePermission(permission: WorkspaceModuleId) {
    setDraft((current) => ({
      ...current,
      permissions: current.permissions.includes(permission) ? current.permissions.filter((item) => item !== permission) : [...current.permissions, permission]
    }));
  }

  async function save() {
    setSaving(true);
    setMessage(null);
    try {
      const isNew = editingId === "new";
      const response = await fetch("/api/workspace/members", {
        method: isNew ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(isNew ? {} : { id: editingId }),
          ...draft,
          email: draft.email || null
        })
      });
      const payload = await response.json() as { ok: boolean; error?: string; member?: WorkspaceMember };
      if (!response.ok || !payload.ok || !payload.member) throw new Error(payload.error || "Não foi possível salvar o colaborador.");
      setMembers((items) => isNew ? [...items, payload.member!].sort((a, b) => a.name.localeCompare(b.name, "pt-BR")) : items.map((item) => item.id === payload.member!.id ? payload.member! : item));
      setEditingId(null);
      setMessage(isNew ? "Colaborador cadastrado." : "Colaborador atualizado.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível salvar o colaborador.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 pb-8">
      <section className="overflow-hidden rounded-[28px] border border-slate-800 bg-slate-950 p-6 text-white shadow-[0_28px_80px_rgba(15,23,42,0.24)] sm:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-red-200">Pessoas e governança</p>
            <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Equipe Vita Power no VITA OS.</h1>
            <p className="mt-3 max-w-3xl text-slate-300">Cadastre colaboradores, área, função, nível de acesso e módulos permitidos. As tarefas passam a ser atribuídas a pessoas reais do time.</p>
          </div>
          <button type="button" onClick={startNew} className="btn-primary"><Plus size={16} /> Novo colaborador</button>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        <Metric label="Colaboradores ativos" value={activeCount} icon={UsersRound} />
        <Metric label="Gestores / admins" value={managers} icon={ShieldCheck} />
        <Metric label="Perfis configurados" value={members.length} icon={UserRoundCheck} />
      </section>

      {message ? <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm">{message}</div> : null}

      {editingId !== null ? (
        <section className="rounded-2xl border border-red-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[0.16em] text-red-700">{editingId === "new" ? "Novo perfil" : "Editar perfil"}</p><h2 className="mt-1 text-xl font-black text-slate-950">{editingId === "new" ? "Cadastrar colaborador" : draft.name}</h2></div><button type="button" className="text-sm font-black text-slate-500" onClick={() => setEditingId(null)}>Cancelar</button></div>
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Field label="Nome"><input value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} className="field" placeholder="Nome do colaborador" /></Field>
            <Field label="E-mail corporativo"><input value={draft.email} onChange={(event) => setDraft((current) => ({ ...current, email: event.target.value }))} className="field" placeholder="nome@vitapower..." /></Field>
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
          return (
            <article key={member.id} className={`rounded-2xl border bg-white p-5 shadow-sm ${member.active ? "border-slate-200" : "border-slate-200 opacity-65"}`}>
              <div className="flex items-start justify-between gap-4">
                <div><div className="flex flex-wrap items-center gap-2"><span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ${member.active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{member.active ? "Ativo" : "Inativo"}</span><span className="rounded-full bg-slate-950 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-white">{accessLabel(member.accessLevel)}</span></div><h2 className="mt-3 text-xl font-black text-slate-950">{member.name}</h2><p className="mt-1 text-sm font-bold text-slate-600">{member.role}</p><p className="mt-1 text-xs text-slate-500">{member.department}{member.email ? ` · ${member.email}` : ""}</p></div>
                <div className="rounded-xl bg-slate-50 px-3 py-2 text-center"><p className="text-xl font-black text-slate-950">{tasks}</p><p className="text-[10px] font-black uppercase tracking-wide text-slate-500">abertas</p></div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">{member.permissions.map((permission) => <span key={permission} className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-slate-600">{workspaceModules.find((item) => item.id === permission)?.label ?? permission}</span>)}</div>
              <div className="mt-5 flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-4"><button type="button" onClick={() => startEdit(member)} className="btn-secondary">Editar perfil</button><Link href={`/admin/tarefas?responsavel=${member.id}`} className="btn-primary">Painel de tarefas <ChevronRight size={16} /></Link></div>
            </article>
          );
        })}
      </section>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="space-y-1.5"><span className="text-xs font-black uppercase tracking-wide text-slate-500">{label}</span>{children}</label>; }
function Metric({ label, value, icon: Icon }: { label: string; value: number; icon: typeof UsersRound }) { return <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex items-center justify-between"><div className="grid h-10 w-10 place-items-center rounded-xl bg-slate-950 text-white"><Icon size={18} /></div><span className="text-2xl font-black text-slate-950">{value}</span></div><p className="mt-3 text-sm font-bold text-slate-600">{label}</p></div>; }
