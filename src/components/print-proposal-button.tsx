"use client";

import { Printer } from "lucide-react";

export function PrintProposalButton() {
  return <button type="button" onClick={() => window.print()} className="btn-primary print:hidden"><Printer size={16} /> Gerar PDF / Imprimir</button>;
}
