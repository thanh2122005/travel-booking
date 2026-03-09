export default function ToursLoading() {
  return (
    <div className="space-y-6 py-6">
      <div className="h-10 w-72 animate-pulse rounded-lg bg-muted" />
      <div className="h-28 animate-pulse rounded-2xl bg-muted" />
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="h-80 animate-pulse rounded-3xl bg-muted" />
        ))}
      </div>
    </div>
  );
}
