export function AdminListPageLoading() {
  return (
    <div className="space-y-5 pb-16">
      <div className="iv-card space-y-3 rounded-2xl border-slate-200 bg-white p-5">
        <div className="h-7 w-48 animate-pulse rounded-lg bg-slate-100/80" />
        <div className="h-4 w-80 max-w-full animate-pulse rounded bg-slate-100/70" />
      </div>

      <div className="iv-admin-filter-form space-y-4">
        <div className="h-4 w-40 animate-pulse rounded bg-slate-100/80" />
        <div className="iv-admin-filter-quick">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-8 w-20 animate-pulse rounded-md bg-slate-100/80" />
          ))}
        </div>
        <div className="iv-admin-filter-grid">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-10 animate-pulse rounded-xl bg-slate-100/80" />
          ))}
        </div>
        <div className="iv-admin-filter-actions">
          <div className="h-10 w-32 animate-pulse rounded-full bg-slate-100/80" />
          <div className="h-10 w-28 animate-pulse rounded-full bg-slate-100/80" />
        </div>
      </div>

      <div className="iv-admin-bulk-card space-y-3">
        <div className="h-4 w-36 animate-pulse rounded bg-slate-100/80" />
        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-10 animate-pulse rounded-xl bg-slate-100/80" />
          ))}
        </div>
      </div>

      <div className="iv-card rounded-2xl border-slate-200 bg-white p-4">
        <div className="space-y-3">
          {Array.from({ length: 7 }).map((_, index) => (
            <div key={index} className="h-12 animate-pulse rounded-xl bg-slate-100/80" />
          ))}
        </div>
      </div>
    </div>
  );
}
