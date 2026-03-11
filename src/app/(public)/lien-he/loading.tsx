export default function ContactLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="h-52 rounded-3xl bg-slate-200" />

      <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="h-[640px] rounded-2xl bg-slate-200" />
        <div className="space-y-4">
          <div className="h-56 rounded-2xl bg-slate-200" />
          <div className="h-40 rounded-2xl bg-slate-200" />
        </div>
      </div>
    </div>
  );
}
