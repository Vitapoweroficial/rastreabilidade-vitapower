import { GenericStep } from "./generic-step";
import type { QuestionnaireAnswers, QuestionnaireStep } from "./types";

export function FormulationStep(props: { step: QuestionnaireStep; answers: QuestionnaireAnswers; onChange: (id: string, value: string | boolean) => void }) {
  return <GenericStep {...props} />;
}
