export default function AppointmentsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-8 w-48 rounded-lg bg-slate-200" />
          <div className="mt-2 h-4 w-32 rounded bg-slate-200" />
        </div>
        <div className="h-10 w-40 rounded-lg bg-slate-200" />
      </div>
      <div className="flex gap-2">
        <div className="h-9 w-9 rounded-lg bg-slate-200" />
        <div className="h-9 w-36 rounded-lg bg-slate-200" />
        <div className="h-9 w-9 rounded-lg bg-slate-200" />
        <div className="h-9 w-24 rounded-lg bg-slate-200" />
      </div>
      <div className="flex gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-10 w-28 rounded-lg border bg-white" />
        ))}
      </div>
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-20 rounded-lg border bg-white" />
        ))}
      </div>
    </div>
  );
}
