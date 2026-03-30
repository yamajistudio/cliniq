export default function FinanceiroLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div>
        <div className="h-8 w-36 rounded-lg bg-slate-200" />
        <div className="mt-2 h-4 w-52 rounded bg-slate-200" />
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-xl border bg-white p-6">
            <div className="h-4 w-24 rounded bg-slate-200" />
            <div className="mt-3 h-7 w-20 rounded bg-slate-200" />
          </div>
        ))}
      </div>
      <div className="rounded-xl border bg-white p-5">
        <div className="h-4 w-40 rounded bg-slate-200" />
        <div className="mt-3 flex gap-3">
          <div className="h-10 flex-1 rounded-lg bg-slate-200" />
          <div className="h-10 w-28 rounded-lg bg-slate-200" />
          <div className="h-10 w-20 rounded-lg bg-slate-200" />
        </div>
      </div>
      <div className="rounded-xl border bg-white">
        <div className="border-b bg-slate-50 px-6 py-4">
          <div className="h-4 w-36 rounded bg-slate-200" />
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 border-b px-6 py-4">
            <div className="h-4 w-32 flex-1 rounded bg-slate-200" />
            <div className="h-4 w-20 rounded bg-slate-200" />
            <div className="h-6 w-16 rounded-full bg-slate-200" />
          </div>
        ))}
      </div>
    </div>
  );
}
