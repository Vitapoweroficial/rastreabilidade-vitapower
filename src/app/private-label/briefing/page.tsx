import type { Metadata } from "next";
import { QuestionnaireShell } from "@/components/private-label/questionnaire-shell";

export const metadata: Metadata = {
  title: "Briefing Private Label | Vita Power",
  description: "Conte seu projeto de suplemento Private Label para a Vita Power iniciar o desenvolvimento técnico e comercial."
};

export default function PublicPrivateLabelBriefingPage() {
  return <main className="min-h-screen bg-[#f4f5f7]"><QuestionnaireShell mode="public" /></main>;
}
