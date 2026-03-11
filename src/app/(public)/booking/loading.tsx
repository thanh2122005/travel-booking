export default function BookingLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="h-52 rounded-3xl bg-slate-200" />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-36 rounded-2xl bg-slate-200" />
        ))}
      </div>

      <div className="h-24 rounded-2xl bg-slate-200" />

      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="h-20 rounded-2xl bg-slate-200" />
        ))}
      </div>
    </div>
  );
}
