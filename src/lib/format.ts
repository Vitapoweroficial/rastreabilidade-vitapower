import type { LotStatus } from "@/lib/types";

export const statusLabels: Record<LotStatus, string> = {
  released: "Liberado",
  quarantine: "Quarentena",
  blocked: "Bloqueado",
  expired: "Vencido"
};

export function formatDate(value: string | null | undefined) {
  if (!value) {
    return "-";
  }

  const date = new Date(`${value}T00:00:00Z`);
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC"
  }).format(date);
}

export function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(`${value.replace(" ", "T")}Z`));
}

export function formatQuantity(quantity: number, unit: string) {
  return `${quantity.toLocaleString("pt-BR")} ${unit}`;
}
