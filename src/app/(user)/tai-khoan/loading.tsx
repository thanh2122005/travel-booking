export default function AccountLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="h-48 rounded-3xl bg-slate-200" />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-28 rounded-2xl bg-slate-200" />
        ))}
      </div>

      <div className="h-[520px] rounded-2xl bg-slate-200" />
      <div className="h-[460px] rounded-2xl bg-slate-200" />
      <div className="h-[420px] rounded-2xl bg-slate-200" />
    </div>
  );
}
