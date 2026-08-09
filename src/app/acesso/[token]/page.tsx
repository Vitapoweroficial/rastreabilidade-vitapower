import { CheckCircle2, KeyRound, ShieldCheck } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import { activateWorkspaceAccessAction } from "./actions";
import { getCurrentWorkspaceSession, inspectWorkspaceInvite } from "@/lib/workspace-auth";

export const dynamic = "force-dynamic";

export default async function ActivateAccessPage({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<{ erro?: string }> }) {
  const session = await getCurrentWorkspaceSession();
  if (session) redirect("/admin");
  const { token } = await params;
  const invite = await inspectWorkspaceInvite(token);
  if (!invite) notFound();
  const query = await searchParams;

  return (
    <main className="min-h-screen bg-[#f4f5f7] p-4 sm:p-8">
      <div className="mx-auto max-w-2xl overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-[0_30px_100px_rgba(15,23,42,0.14)]">
        <section className="bg-gradient-to-br from-slate-950 via-slate-900 to-red-950 p-7 text-white sm:p-9">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-red-500/15 text-red-200"><KeyRound size={24} /></div>
          <p className="mt-6 text-xs font-black uppercase tracking-[0.2em] text-red-200">Convite VITA OS</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight">Ative seu acesso ao Workspace.</h1>
          <p className="mt-3 text-slate-300">{invite.name} · {invite.department} · {invite.role}</p>
        </section>
        <section className="p-6 sm:p-8">
          <div className="mb-5 flex items-start gap-3 rounded-2xl bg-emerald-50 p-4 text-emerald-900"><ShieldCheck size={20} className="mt-0.5 shrink-0" /><div><p className="font-black">Acesso individual</p><p className="mt-1 text-sm leading-5">Sua senha será armazenada de forma derivada e a sessão será protegida por cookie HttpOnly.</p></div></div>
          {query.erro ? <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-800">{query.erro}</div> : null}
          <form action={activateWorkspaceAccessAction} className="space-y-4">
            <input type="hidden" name="token" value={token} />
            <label className="block space-y-1.5"><span className="label">E-mail</span><input className="field" value={invite.email ?? "E-mail não cadastrado"} readOnly /></label>
            <label className="block space-y-1.5"><span className="label">Crie sua senha</span><input className="field" type="password" name="password" autoComplete="new-password" minLength={12} required placeholder="Mínimo 12 caracteres" /></label>
            <label className="block space-y-1.5"><span className="label">Confirme a senha</span><input className="field" type="password" name="confirmPassword" autoComplete="new-password" minLength={12} required /></label>
            <button className="btn-primary min-h-12 w-full justify-center" type="submit"><CheckCircle2 size={17} /> Ativar e entrar</button>
          </form>
        </section>
      </div>
    </main>
  );
}
