import { LockKeyhole, ShieldCheck, Sparkles } from "lucide-react";
import { redirect } from "next/navigation";
import { loginAction } from "./actions";
import { getCurrentWorkspaceSession } from "@/lib/workspace-auth";

export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ erro?: string }> }) {
  const session = await getCurrentWorkspaceSession();
  if (session) redirect("/admin");
  const params = await searchParams;

  return (
    <main className="min-h-screen bg-[#f4f5f7] p-4 sm:p-8">
      <div className="mx-auto grid min-h-[calc(100vh-2rem)] max-w-6xl overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-[0_40px_120px_rgba(15,23,42,0.14)] lg:grid-cols-[1.08fr_.92fr]">
        <section className="relative hidden overflow-hidden bg-slate-950 p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-red-600/25 blur-3xl" />
          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-full border border-red-400/20 bg-red-500/10 px-3 py-1.5 text-xs font-black uppercase tracking-[0.18em] text-red-200"><Sparkles size={14} /> VITA OS</div>
            <h1 className="mt-8 max-w-xl text-5xl font-black tracking-[-0.05em]">A operação industrial da Vita Power em um único lugar.</h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-slate-300">Clientes, Private Label, engenharia, custos, tarefas, lotes e decisões com acesso individual e rastreabilidade de responsabilidade.</p>
          </div>
          <div className="relative grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4"><ShieldCheck className="text-red-300" size={22} /><p className="mt-3 font-black">Permissões por função</p><p className="mt-1 text-sm text-slate-400">Cada pessoa vê apenas o que precisa operar.</p></div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4"><LockKeyhole className="text-red-300" size={22} /><p className="mt-3 font-black">Sessão protegida</p><p className="mt-1 text-sm text-slate-400">Credenciais e tokens nunca ficam expostos no navegador.</p></div>
          </div>
        </section>

        <section className="flex items-center p-6 sm:p-10 lg:p-12">
          <div className="mx-auto w-full max-w-md">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-950 to-red-900 text-sm font-black tracking-wide text-white shadow-lg">VP</div>
            <p className="mt-7 text-xs font-black uppercase tracking-[0.2em] text-red-700">Vita Power Workspace</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">Entrar no VITA OS</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">Use seu e-mail corporativo e a senha definida no convite de acesso.</p>
            {params.erro ? <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-800">{params.erro}</div> : null}
            <form action={loginAction} className="mt-7 space-y-4">
              <label className="block space-y-1.5"><span className="label">E-mail</span><input className="field" type="email" name="email" autoComplete="email" required placeholder="nome@vitapowernutrition.com.br" /></label>
              <label className="block space-y-1.5"><span className="label">Senha</span><input className="field" type="password" name="password" autoComplete="current-password" required minLength={12} placeholder="Sua senha" /></label>
              <button className="btn-primary min-h-12 w-full justify-center" type="submit"><LockKeyhole size={17} /> Entrar com segurança</button>
            </form>
            <p className="mt-6 text-xs leading-5 text-slate-400">Acesso interno Vita Power. Tentativas e ações relevantes ficam registradas para rastreabilidade operacional.</p>
          </div>
        </section>
      </div>
    </main>
  );
}
