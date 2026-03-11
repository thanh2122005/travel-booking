export default function ReviewsLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="h-52 rounded-3xl bg-slate-200" />
      <div className="h-28 rounded-2xl bg-slate-200" />
      <div className="h-24 rounded-2xl bg-slate-200" />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="h-64 rounded-2xl bg-slate-200" />
        ))}
      </div>
    </div>
  );
}
