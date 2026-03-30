export default function PatientsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-8 w-40 rounded-lg bg-slate-200" />
          <div className="mt-2 h-4 w-24 rounded bg-slate-200" />
        </div>
        <div className="h-10 w-36 rounded-lg bg-slate-200" />
      </div>
      <div className="h-10 w-full rounded-lg bg-slate-200" />
      <div className="overflow-hidden rounded-xl border bg-white">
        <div className="border-b bg-slate-50 px-6 py-3">
          <div className="h-4 w-32 rounded bg-slate-200" />
        </div>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 border-b px-6 py-4">
            <div className="h-10 w-10 rounded-full bg-slate-200" />
            <div className="flex-1">
              <div className="h-4 w-40 rounded bg-slate-200" />
              <div className="mt-1 h-3 w-24 rounded bg-slate-200" />
            </div>
            <div className="h-6 w-16 rounded-full bg-slate-200" />
          </div>
        ))}
      </div>
    </div>
  );
}
