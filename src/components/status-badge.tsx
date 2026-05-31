import { statusLabels } from "@/lib/format";
import type { LotStatus } from "@/lib/types";

const styles: Record<LotStatus, string> = {
  released: "border-emerald-200 bg-emerald-50 text-emerald-700",
  quarantine: "border-amber-200 bg-amber-50 text-amber-800",
  blocked: "border-rose-200 bg-rose-50 text-rose-700",
  expired: "border-slate-200 bg-slate-100 text-slate-700"
};

export function StatusBadge({ status }: { status: LotStatus }) {
  return (
    <span className={`inline-flex min-h-8 items-center rounded-full border px-3 text-xs font-black ${styles[status]}`}>
      {statusLabels[status]}
    </span>
  );
}
