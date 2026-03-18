export default function AdminLoadingPage() {
  return (
    <div className="space-y-4 pb-8">
      <div className="iv-card h-40 animate-pulse rounded-2xl border-slate-200 bg-slate-100" />
      <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="iv-card h-32 animate-pulse rounded-2xl border-slate-200 bg-slate-100" />
        ))}
      </div>
      <div className="grid gap-4 2xl:grid-cols-[2fr_1fr]">
        <div className="iv-card h-[360px] animate-pulse rounded-2xl border-slate-200 bg-slate-100" />
        <div className="space-y-4">
          <div className="iv-card h-[170px] animate-pulse rounded-2xl border-slate-200 bg-slate-100" />
          <div className="iv-card h-[170px] animate-pulse rounded-2xl border-slate-200 bg-slate-100" />
        </div>
      </div>
    </div>
  );
}
