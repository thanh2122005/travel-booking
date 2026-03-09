export default function TourDetailLoading() {
  return (
    <div className="space-y-6 py-6">
      <div className="h-8 w-64 animate-pulse rounded bg-muted" />
      <div className="h-12 w-full max-w-3xl animate-pulse rounded bg-muted" />
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-4">
          <div className="h-96 animate-pulse rounded-3xl bg-muted" />
          <div className="h-52 animate-pulse rounded-3xl bg-muted" />
        </div>
        <div className="h-64 animate-pulse rounded-3xl bg-muted" />
      </div>
    </div>
  );
}
