"use client";
import { useState } from "react";

export default function VitaIaPage() {
  const [message, setMessage] = useState("Liste meus produtos");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  async function ask() {
    setLoading(true); setAnswer("");
    const res = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message }) });
    const json = await res.json(); setAnswer(json.answer ?? json.error ?? "Sem resposta."); setLoading(false);
  }
  return <div className="space-y-6"><div><p className="text-sm font-bold uppercase text-brass">VITA IA</p><h1 className="mt-2 text-3xl font-black text-ink">Chat com Bling</h1><p className="mt-2 text-slate-600">Consulte produtos, pedidos, estoque e ordens de produção sem expor tokens no frontend.</p></div><div className="panel p-5"><textarea className="textarea" value={message} onChange={(e)=>setMessage(e.target.value)} /><button className="btn-primary mt-4" onClick={ask} disabled={loading}>{loading?"Consultando...":"Perguntar"}</button></div><pre className="panel whitespace-pre-wrap p-5 text-sm text-slate-700">{answer || "Exemplos: Liste meus produtos; Quais pedidos estão abertos?; Qual o estoque da Creatina?; Quais OPs estão em andamento?"}</pre></div>;
}
