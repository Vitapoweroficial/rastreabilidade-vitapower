import type { QuestionnaireAnswers, QuestionnaireStep } from "./types";

function valueOf(answers: QuestionnaireAnswers, key: string) { return String(answers[key] ?? "—"); }
function brl(value: number) { return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }); }

export function ReviewStep({ steps, answers }: { step: QuestionnaireStep; steps: QuestionnaireStep[]; answers: QuestionnaireAnswers }) {
  const doseKg = Number(valueOf(answers, "servingGrams")) / 1000 || 0;
  const quantity = Number(valueOf(answers, "quantity")) || 0;
  const loss = Number(valueOf(answers, "lossPercent")) || 0;
  const margin = Number(valueOf(answers, "marginPercent")) || 0;
  const labor = Number(valueOf(answers, "laborCost")) || 0;
  const packaging = Number(valueOf(answers, "packagingCost")) || 0;
  const estimatedRawMaterial = doseKg * 45;
  const unitCost = estimatedRawMaterial * (1 + loss / 100) + labor + packaging;
  const unitPrice = unitCost * (1 + margin / 100);
  const total = unitPrice * quantity;

  return <section className="panel p-5"><p className="text-sm font-black uppercase text-brass">Revisão final</p><h2 className="mt-1 text-2xl font-black text-ink">Resumo do Questionário Private Label</h2><div className="mt-5 grid gap-3 md:grid-cols-4"><div className="rounded-xl bg-mist p-4"><span className="text-xs font-black uppercase text-slate-500">Cliente</span><strong className="mt-1 block text-ink">{valueOf(answers, "companyName")}</strong></div><div className="rounded-xl bg-mist p-4"><span className="text-xs font-black uppercase text-slate-500">Produto</span><strong className="mt-1 block text-ink">{valueOf(answers, "productName")}</strong></div><div className="rounded-xl bg-mist p-4"><span className="text-xs font-black uppercase text-slate-500">Quantidade</span><strong className="mt-1 block text-ink">{quantity.toLocaleString("pt-BR")}</strong></div><div className="rounded-xl bg-mist p-4"><span className="text-xs font-black uppercase text-slate-500">Total estimado</span><strong className="mt-1 block text-ink">{brl(total)}</strong></div></div><div className="mt-5 grid gap-4 md:grid-cols-2"><div className="rounded-xl border border-line p-4"><h3 className="font-black text-ink">Estimativa comercial</h3><p className="mt-2 text-sm text-slate-600">Custo unitário estimado: {brl(unitCost)}</p><p className="text-sm text-slate-600">Preço unitário sugerido: {brl(unitPrice)}</p><p className="text-sm text-slate-600">Valor total sugerido: {brl(total)}</p></div><div className="rounded-xl border border-line p-4"><h3 className="font-black text-ink">Fluxo após aprovação</h3><p className="mt-2 text-sm text-slate-600">Proposta → Pagamento → Dossiê → Rotulagem → Estabilidade → Arte → Embalagens → OP → Produção → Expedição.</p></div></div><div className="mt-5 space-y-3">{steps.filter((item) => item.questions.length > 0).map((item) => <details key={item.id} className="rounded-xl border border-line p-4"><summary className="cursor-pointer font-black text-ink">{item.eyebrow}. {item.title}</summary><dl className="mt-3 grid gap-3 md:grid-cols-2">{item.questions.map((question) => <div key={question.id}><dt className="text-xs font-black uppercase text-slate-500">{question.label}</dt><dd className="text-sm text-slate-700">{valueOf(answers, question.id)}</dd></div>)}</dl></details>)}</div></section>;
}
