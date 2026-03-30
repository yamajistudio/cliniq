export default function ProfessionalsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-8 w-44 rounded-lg bg-slate-200" />
          <div className="mt-2 h-4 w-20 rounded bg-slate-200" />
        </div>
        <div className="h-10 w-44 rounded-lg bg-slate-200" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-xl border bg-white p-5">
            <div className="h-4 w-36 rounded bg-slate-200" />
            <div className="mt-2 h-3 w-24 rounded bg-slate-200" />
            <div className="mt-3 h-6 w-14 rounded-full bg-slate-200" />
          </div>
        ))}
      </div>
    </div>
  );
}
