import type { QuestionnaireStep } from "./types";

export function QuestionnaireProgress({ steps, currentStep }: { steps: QuestionnaireStep[]; currentStep: number }) {
  const percent = Math.round(((currentStep + 1) / steps.length) * 100);
  return <div className="panel p-4"><div className="flex items-center justify-between text-sm font-black text-ink"><span>Progresso</span><span>{percent}%</span></div><div className="mt-3 h-2 rounded-full bg-mist"><div className="h-2 rounded-full bg-moss transition-all" style={{ width: `${percent}%` }} /></div><div className="mt-4 grid gap-2 md:grid-cols-6">{steps.map((step, index) => <span key={step.id} className={["rounded-full px-3 py-2 text-center text-xs font-black", index <= currentStep ? "bg-moss text-white" : "bg-white text-slate-500 ring-1 ring-line"].join(" ")}>{step.eyebrow}. {step.title}</span>)}</div></div>;
}
