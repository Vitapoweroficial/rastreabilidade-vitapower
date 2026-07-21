import { NextRequest, NextResponse } from "next/server";
import { blingGet } from "@/lib/bling";

const tools = [
  { name: "consultarProdutos", description: "Lista produtos reais do Bling", path: "/produtos" },
  { name: "consultarPedidos", description: "Lista pedidos de venda reais do Bling", path: "/pedidos/vendas" },
  { name: "consultarEstoque", description: "Consulta saldos de estoque reais do Bling", path: "/estoques/saldos" },
  { name: "consultarOrdensProducao", description: "Lista ordens de produção reais do Bling", path: "/ordens-producao" },
] as const;

function inferTool(message: string) {
  const text = message.toLowerCase();
  if (text.includes("pedido")) return tools[1];
  if (text.includes("estoque") || text.includes("saldo")) return tools[2];
  if (text.includes("op") || text.includes("ordem") || text.includes("produção") || text.includes("producao")) return tools[3];
  return tools[0];
}

async function callOpenAI(message: string, toolName: string, data: unknown) {
  if (!process.env.OPENAI_API_KEY) {
    return `Consulta ${toolName} executada. Configure OPENAI_API_KEY para receber uma análise conversacional.\n\n${JSON.stringify(data, null, 2).slice(0, 4000)}`;
  }
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: process.env.OPENAI_MODEL ?? "gpt-4o-mini", messages: [
      { role: "system", content: "Você é a VITA IA, assistente operacional da Vita Power. Responda em português, com clareza, usando apenas os dados reais recebidos do Bling. Não invente dados." },
      { role: "user", content: message },
      { role: "system", content: `Resultado da tool ${toolName}: ${JSON.stringify(data).slice(0, 12000)}` }
    ], temperature: 0.2 })
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.error?.message || "Erro ao chamar OpenAI.");
  return json?.choices?.[0]?.message?.content ?? "Não foi possível gerar uma resposta.";
}

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();
    if (!message || typeof message !== "string") return NextResponse.json({ error: "Envie uma mensagem para a VITA IA." }, { status: 400 });
    const tool = inferTool(message);
    const data = await blingGet(tool.path, { pagina: 1, limite: 20 });
    const answer = await callOpenAI(message, tool.name, data);
    return NextResponse.json({ answer, tool: tool.name, data });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erro inesperado na VITA IA." }, { status: 500 });
  }
}
