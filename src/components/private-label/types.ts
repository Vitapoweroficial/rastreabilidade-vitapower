export type QuestionType = "text" | "textarea" | "number" | "select" | "checkbox";

export type Question = {
  id: string;
  label: string;
  type: QuestionType;
  placeholder?: string;
  options?: string[];
};

export type QuestionnaireStep = {
  id: string;
  title: string;
  eyebrow: string;
  description: string;
  questions: Question[];
};

export type QuestionnaireAnswers = Record<string, string | boolean>;
