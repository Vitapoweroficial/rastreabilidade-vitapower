import Link from "next/link";
import { isBlingConnected, getBlingToken } from "@/lib/bling";

export const dynamic = "force-dynamic";
export default async function TestBlingPage({ searchParams }: { searchParams: Promise<{ connected?: string; error?: string }> }) {
  const params = await searchParams;
  const connected = isBlingConnected();
  const token = getBlingToken();
  return <main className="min-h-screen bg-paper p-6"><div className="mx-auto max-w-3xl space-y-6"><h1 className="text-3xl font-black text-ink">Teste de conexão Bling</h1>{params.error && <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">{params.error}</div>}{params.connected && <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-700">Bling conectado com sucesso.</div>}<section className="panel p-5"><p className="font-bold">Status: {connected ? "Conectado" : "Não conectado"}</p>{token && <p className="mt-2 text-sm text-slate-600">Token expira em {new Date(token.expires_at).toLocaleString("pt-BR")}.</p>}<Link href="/api/auth/bling" className="btn-primary mt-4 inline-flex">Autenticar no Bling</Link></section><section className="grid gap-3 sm:grid-cols-2"><Link className="btn-secondary" href="/api/bling/products">Testar produtos</Link><Link className="btn-secondary" href="/api/bling/orders">Testar pedidos</Link><Link className="btn-secondary" href="/api/bling/stock">Testar estoque</Link><Link className="btn-secondary" href="/api/bling/production-orders">Testar OPs</Link></section><Link href="/admin/vita-ia" className="text-sm font-bold text-brass">Abrir chat VITA IA</Link></div></main>;
}
