import type { QuestionnaireAnswers, QuestionnaireStep } from "./types";

function valueOf(answers: QuestionnaireAnswers, key: string) {
  const value = answers[key];
  if (typeof value === "boolean") return value ? "Sim" : "Não";
  const normalized = String(value ?? "").trim();
  return normalized || "—";
}

export function ReviewStep({ steps, answers }: { step: QuestionnaireStep; steps: QuestionnaireStep[]; answers: QuestionnaireAnswers }) {
  const quantity = Number(valueOf(answers, "quantity")) || 0;

  return (
    <section className="panel p-5">
      <p className="text-sm font-black uppercase text-brass">Revisão final</p>
      <h2 className="mt-1 text-2xl font-black text-ink">Revise antes de enviar</h2>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Depois do envio, este briefing será registrado no VITA OS e ligado ao cadastro do cliente, produto e projeto Private Label.</p>

      <div className="mt-5 grid gap-3 md:grid-cols-4">
        <div className="rounded-xl bg-mist p-4"><span className="text-xs font-black uppercase text-slate-500">Empresa / marca</span><strong className="mt-1 block text-ink">{valueOf(answers, "tradeName") !== "—" ? valueOf(answers, "tradeName") : valueOf(answers, "companyName")}</strong></div>
        <div className="rounded-xl bg-mist p-4"><span className="text-xs font-black uppercase text-slate-500">Projeto</span><strong className="mt-1 block text-ink">{valueOf(answers, "projectName")}</strong></div>
        <div className="rounded-xl bg-mist p-4"><span className="text-xs font-black uppercase text-slate-500">Produto</span><strong className="mt-1 block text-ink">{valueOf(answers, "productName")}</strong></div>
        <div className="rounded-xl bg-mist p-4"><span className="text-xs font-black uppercase text-slate-500">Quantidade inicial</span><strong className="mt-1 block text-ink">{quantity ? quantity.toLocaleString("pt-BR") : "A definir"}</strong></div>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-line p-4"><h3 className="font-black text-ink">O que acontece com este briefing</h3><p className="mt-2 text-sm leading-6 text-slate-600">A Vita Power recebe os dados já organizados no cadastro do cliente e abre o projeto no pipeline Private Label, evitando nova digitação das mesmas informações.</p></div>
        <div className="rounded-xl border border-line p-4"><h3 className="font-black text-ink">Fluxo de desenvolvimento</h3><p className="mt-2 text-sm leading-6 text-slate-600">Briefing → Fórmula → Embalagem → Precificação → Proposta → Aprovação → Produção → Lote → Entrega.</p></div>
      </div>

      <div className="mt-5 space-y-3">
        {steps.filter((item) => item.questions.length > 0).map((item) => (
          <details key={item.id} className="rounded-xl border border-line p-4">
            <summary className="cursor-pointer font-black text-ink">{item.eyebrow}. {item.title}</summary>
            <dl className="mt-3 grid gap-3 md:grid-cols-2">
              {item.questions.map((question) => <div key={question.id}><dt className="text-xs font-black uppercase text-slate-500">{question.label}</dt><dd className="whitespace-pre-wrap text-sm text-slate-700">{valueOf(answers, question.id)}</dd></div>)}
            </dl>
          </details>
        ))}
      </div>
    </section>
  );
}
