"use client";

import Link from "next/link";
import { CheckCircle2, Send, ShieldCheck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { BrandStep } from "./brand-step";
import { CommercialStep } from "./commercial-step";
import { CompanyStep } from "./company-step";
import { FormulationStep } from "./formulation-step";
import { PackagingStep } from "./packaging-step";
import { PresentationStep } from "./presentation-step";
import { ProductionStep } from "./production-step";
import { ProductStep } from "./product-step";
import { ProjectStep } from "./project-step";
import { QuestionnaireNavigation } from "./questionnaire-navigation";
import { privateLabelSteps, defaultAnswers } from "./questionnaire-data";
import { QuestionnaireProgress } from "./questionnaire-progress";
import { ReviewStep } from "./review-step";
import { SensoryStep } from "./sensory-step";
import { ServicesStep } from "./services-step";
import type { QuestionnaireAnswers, QuestionnaireStep } from "./types";

const storageKey = "vita-power-private-label-questionnaire";
const submissionKeyStorage = "vita-power-private-label-submission-key";

function renderStep(step: QuestionnaireStep, answers: QuestionnaireAnswers, onChange: (id: string, value: string | boolean) => void) {
  const props = { step, answers, onChange };
  switch (step.id) {
    case "empresa": return <CompanyStep {...props} />;
    case "projeto": return <ProjectStep {...props} />;
    case "produto": return <ProductStep {...props} />;
    case "formulacao": return <FormulationStep {...props} />;
    case "apresentacao": return <PresentationStep {...props} />;
    case "sensorial": return <SensoryStep {...props} />;
    case "embalagem": return <PackagingStep {...props} />;
    case "marca": return <BrandStep {...props} />;
    case "producao": return <ProductionStep {...props} />;
    case "comercial": return <CommercialStep {...props} />;
    case "servicos": return <ServicesStep {...props} />;
    default: return <ReviewStep step={step} steps={privateLabelSteps} answers={answers} />;
  }
}

function answerText(answers: QuestionnaireAnswers, key: string) {
  const value = answers[key];
  return typeof value === "string" ? value.trim() : "";
}

function validation(answers: QuestionnaireAnswers) {
  if (!answerText(answers, "companyName") && !answerText(answers, "tradeName")) return { step: 0, message: "Informe o nome da empresa ou da marca." };
  if (!answerText(answers, "contactName")) return { step: 0, message: "Informe o responsável pelo projeto." };
  if (!answerText(answers, "email") && !answerText(answers, "phone")) return { step: 0, message: "Informe um e-mail ou WhatsApp para contato." };
  if (!answerText(answers, "projectName")) return { step: 1, message: "Informe um nome para o projeto." };
  if (!answerText(answers, "productName")) return { step: 2, message: "Informe o produto desejado." };
  return null;
}

type SubmissionResult = {
  briefingId: number;
  clientId: number;
  projectId: number;
  productId: number | null;
};

export function QuestionnaireShell({ mode = "internal" }: { mode?: "internal" | "public" }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<QuestionnaireAnswers>(defaultAnswers);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [result, setResult] = useState<SubmissionResult | null>(null);
  const step = privateLabelSteps[currentStep];

  useEffect(() => {
    const stored = window.localStorage.getItem(storageKey);
    if (stored) {
      try {
        setAnswers({ ...defaultAnswers, ...JSON.parse(stored) });
      } catch {
        window.localStorage.removeItem(storageKey);
      }
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(answers));
    setSavedAt(new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
  }, [answers]);

  const completionLabel = useMemo(() => `${currentStep + 1} de ${privateLabelSteps.length}`, [currentStep]);

  function updateAnswer(id: string, value: string | boolean) {
    setSubmitError(null);
    setAnswers((current) => ({ ...current, [id]: value }));
  }

  function resetQuestionnaire() {
    if (!window.confirm("Deseja iniciar um novo questionário?")) return;
    window.localStorage.removeItem(storageKey);
    window.localStorage.removeItem(submissionKeyStorage);
    setAnswers(defaultAnswers);
    setCurrentStep(0);
    setResult(null);
    setSubmitError(null);
  }

  async function submitQuestionnaire() {
    const issue = validation(answers);
    if (issue) {
      setSubmitError(issue.message);
      setCurrentStep(issue.step);
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    try {
      let submissionKey = window.localStorage.getItem(submissionKeyStorage);
      if (!submissionKey) {
        submissionKey = window.crypto.randomUUID();
        window.localStorage.setItem(submissionKeyStorage, submissionKey);
      }

      const response = await fetch("/api/private-label/briefings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submissionKey,
          answers,
          source: mode === "public" ? "public_form" : "internal_form"
        })
      });
      const payload = await response.json() as { ok: boolean; error?: string } & SubmissionResult;
      if (!response.ok || !payload.ok) throw new Error(payload.error || "Não foi possível enviar o briefing.");

      setResult({ briefingId: payload.briefingId, clientId: payload.clientId, projectId: payload.projectId, productId: payload.productId });
      window.localStorage.removeItem(storageKey);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Não foi possível enviar o briefing.");
    } finally {
      setSubmitting(false);
    }
  }

  if (result) {
    const protocol = `VP-PL-${String(result.briefingId).padStart(5, "0")}`;
    return (
      <div className={mode === "public" ? "mx-auto max-w-4xl px-4 py-10 sm:py-16" : "space-y-6"}>
        <section className="overflow-hidden rounded-[28px] border border-emerald-200 bg-white shadow-[0_30px_90px_rgba(15,23,42,0.12)]">
          <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 p-7 text-white sm:p-10">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-emerald-500/15 text-emerald-300"><CheckCircle2 size={30} /></div>
            <p className="mt-6 text-xs font-black uppercase tracking-[0.2em] text-emerald-300">Briefing recebido</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Seu projeto já entrou no fluxo da Vita Power.</h1>
            <p className="mt-4 max-w-2xl text-slate-300">As informações foram registradas no VITA OS e vinculadas ao cadastro do cliente, produto e projeto Private Label. Não será necessário preencher tudo novamente.</p>
          </div>
          <div className="grid gap-4 p-6 sm:grid-cols-2 sm:p-8">
            <div className="rounded-2xl bg-slate-50 p-5"><p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Protocolo</p><p className="mt-2 text-2xl font-black text-slate-950">{protocol}</p></div>
            <div className="rounded-2xl bg-slate-50 p-5"><p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Próxima etapa</p><p className="mt-2 font-black text-slate-950">Análise do briefing pela equipe Vita Power</p></div>
            <div className="sm:col-span-2 flex flex-col gap-3 sm:flex-row">
              <button type="button" className="btn-secondary" onClick={resetQuestionnaire}>Enviar outro projeto</button>
              {mode === "internal" ? <Link className="btn-primary" href={`/admin/clientes/${result.clientId}`}>Abrir DNA do cliente</Link> : null}
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className={mode === "public" ? "mx-auto max-w-6xl space-y-6 px-4 py-6 sm:py-10" : "space-y-6 print:bg-white"}>
      <section className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-slate-950 via-slate-900 to-red-950 p-6 text-white shadow-[0_28px_80px_rgba(15,23,42,0.18)] sm:p-8 print:text-ink">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-red-600/20 blur-3xl" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-red-200"><ShieldCheck size={15} /> Vita Power Private Label</div>
            <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">{mode === "public" ? "Conte o projeto que você quer colocar no mercado" : "Questionário Private Label"}</h1>
            <p className="mt-3 max-w-3xl leading-7 text-slate-300 print:text-slate-700">Preencha o briefing com o máximo de contexto possível. Ao enviar, seus dados entram automaticamente no nosso sistema de desenvolvimento para a equipe dar continuidade sem redigitação.</p>
          </div>
          <div className="flex flex-wrap gap-2 print:hidden">
            {mode === "internal" ? <button className="btn-secondary border-white/15 bg-white/10 text-white hover:bg-white/20" type="button" onClick={resetQuestionnaire}>Novo questionário</button> : null}
            <button className="btn-primary bg-red-600 hover:bg-red-500" type="button" onClick={() => window.print()}>Gerar PDF / Imprimir</button>
          </div>
        </div>
      </section>

      {mode === "public" ? (
        <section className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-4"><p className="text-sm font-black text-slate-950">1. Você descreve</p><p className="mt-1 text-sm text-slate-500">Marca, público, produto, fórmula e embalagem.</p></div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4"><p className="text-sm font-black text-slate-950">2. O sistema organiza</p><p className="mt-1 text-sm text-slate-500">Cliente, produto e projeto são criados automaticamente.</p></div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4"><p className="text-sm font-black text-slate-950">3. A Vita Power continua</p><p className="mt-1 text-sm text-slate-500">Engenharia, custo, proposta, produção e lote.</p></div>
        </section>
      ) : null}

      <div className="flex flex-col gap-2 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between"><span className="font-bold">Etapa {completionLabel}</span><span>{savedAt ? `Rascunho salvo neste dispositivo às ${savedAt}` : "Salvamento automático ativado"}</span></div>
      <QuestionnaireProgress steps={privateLabelSteps} currentStep={currentStep} />
      {submitError ? <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-800">{submitError}</div> : null}
      {renderStep(step, answers, updateAnswer)}
      <QuestionnaireNavigation currentStep={currentStep} totalSteps={privateLabelSteps.length} onBack={() => setCurrentStep((value) => Math.max(0, value - 1))} onNext={() => setCurrentStep((value) => Math.min(privateLabelSteps.length - 1, value + 1))} onPrint={() => window.print()} onSubmit={submitQuestionnaire} submitting={submitting} />
      {currentStep === privateLabelSteps.length - 1 ? <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-900"><Send size={18} className="shrink-0" /> Ao enviar, o briefing entra imediatamente no VITA OS e fica ligado ao DNA do cliente.</div> : null}
    </div>
  );
}
