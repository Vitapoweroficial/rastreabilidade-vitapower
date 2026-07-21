export function QuestionnaireNavigation({ currentStep, totalSteps, onBack, onNext, onPrint }: { currentStep: number; totalSteps: number; onBack: () => void; onNext: () => void; onPrint: () => void }) {
  const last = currentStep === totalSteps - 1;
  return <div className="flex flex-col gap-3 sm:flex-row sm:justify-between"><button type="button" className="btn-secondary" onClick={onBack} disabled={currentStep === 0}>Voltar</button><div className="flex gap-3"><button type="button" className="btn-secondary" onClick={onPrint}>Gerar PDF / Imprimir</button><button type="button" className="btn-primary" onClick={onNext}>{last ? "Revisar novamente" : "Próxima etapa"}</button></div></div>;
}
