export function StatCard({
  icon,
  label,
  value
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="panel flex items-center justify-between gap-4 p-5">
      <div>
        <p className="text-sm font-bold text-slate-500">{label}</p>
        <p className="mt-2 text-3xl font-black text-ink">{value.toLocaleString("pt-BR")}</p>
      </div>
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-mist text-moss">{icon}</div>
    </div>
  );
}
