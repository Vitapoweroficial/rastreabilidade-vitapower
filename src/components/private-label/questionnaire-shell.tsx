"use client";

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

export function QuestionnaireShell() {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<QuestionnaireAnswers>(defaultAnswers);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const step = privateLabelSteps[currentStep];

  useEffect(() => {
    const stored = window.localStorage.getItem(storageKey);
    if (stored) setAnswers({ ...defaultAnswers, ...JSON.parse(stored) });
  }, []);

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(answers));
    setSavedAt(new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
  }, [answers]);

  const completionLabel = useMemo(() => `${currentStep + 1} de ${privateLabelSteps.length}`, [currentStep]);

  function updateAnswer(id: string, value: string | boolean) {
    setAnswers((current) => ({ ...current, [id]: value }));
  }

  function resetQuestionnaire() {
    if (!window.confirm("Deseja limpar o questionário atual?")) return;
    window.localStorage.removeItem(storageKey);
    setAnswers(defaultAnswers);
    setCurrentStep(0);
  }

  return <div className="space-y-6 print:bg-white"><section className="panel overflow-hidden bg-gradient-to-br from-ink to-moss p-6 text-white print:text-ink"><div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"><div><p className="text-sm font-black uppercase text-brass">Private Label</p><h1 className="mt-2 text-3xl font-black">Questionário Private Label</h1><p className="mt-2 max-w-3xl text-white/75 print:text-slate-700">Briefing completo para transformar necessidade comercial em projeto, fórmula, embalagem, precificação e proposta.</p></div><div className="flex flex-wrap gap-2"><button className="btn-secondary bg-white/10 text-white hover:bg-white/20 print:hidden" type="button" onClick={resetQuestionnaire}>Novo questionário</button><button className="btn-primary print:hidden" type="button" onClick={() => window.print()}>Gerar PDF / Imprimir</button></div></div></section><div className="flex flex-col gap-2 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between"><span className="font-bold">Etapa {completionLabel}</span><span>{savedAt ? `Salvo automaticamente às ${savedAt}` : "Salvamento automático ativado"}</span></div><QuestionnaireProgress steps={privateLabelSteps} currentStep={currentStep} />{renderStep(step, answers, updateAnswer)}<QuestionnaireNavigation currentStep={currentStep} totalSteps={privateLabelSteps.length} onBack={() => setCurrentStep((value) => Math.max(0, value - 1))} onNext={() => setCurrentStep((value) => value === privateLabelSteps.length - 1 ? 0 : value + 1)} onPrint={() => window.print()} /></div>;
}
