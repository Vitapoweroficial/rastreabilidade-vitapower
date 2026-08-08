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

  const normalized = /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00Z` : value;
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return "-";

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

  const normalized = value.includes("T") ? value : value.replace(" ", "T");
  const hasTimezone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(normalized);
  const date = new Date(hasTimezone ? normalized : `${normalized}Z`);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

export function formatQuantity(quantity: number, unit: string) {
  return `${quantity.toLocaleString("pt-BR")} ${unit}`;
}
