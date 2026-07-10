import { AdminNav } from "@/components/admin-nav";

export default function AdminLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen bg-[#f6f8f2]">
      <div className="mx-auto grid min-h-screen max-w-[1480px] grid-cols-1 lg:grid-cols-[280px_1fr]">
        <aside className="border-b border-line bg-white px-5 py-5 lg:border-b-0 lg:border-r">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-moss text-sm font-black text-white">
              VP
            </div>
            <div>
              <p className="text-sm font-black text-ink">Vita Power</p>
              <p className="text-xs font-semibold text-slate-500">Rastreabilidade</p>
            </div>
          </div>
          <AdminNav />
        </aside>
        <main className="px-5 py-6 sm:px-8 lg:px-10">{children}</main>
      </div>
    </div>
  );
}
