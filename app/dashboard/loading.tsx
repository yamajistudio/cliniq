export default function DashboardLoading() {
  return (
    <div className="min-w-0 space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="flex items-end justify-between">
        <div>
          <div className="h-8 w-64 rounded-lg bg-slate-200" />
          <div className="mt-2 h-4 w-40 rounded bg-slate-200" />
        </div>
        <div className="flex gap-3">
          <div className="h-11 w-40 rounded-lg bg-slate-200" />
          <div className="h-11 w-36 rounded-lg bg-slate-200" />
        </div>
      </div>

      {/* Stats skeleton */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border bg-white p-6">
            <div className="mb-4 h-10 w-10 rounded-lg bg-slate-200" />
            <div className="h-4 w-24 rounded bg-slate-200" />
            <div className="mt-2 h-7 w-16 rounded bg-slate-200" />
          </div>
        ))}
      </div>

      {/* Content skeleton */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <div className="rounded-xl border bg-white">
            <div className="border-b bg-slate-50 px-5 py-3">
              <div className="h-4 w-40 rounded bg-slate-200" />
            </div>
            <div className="divide-y">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-5 py-3">
                  <div className="h-11 w-14 rounded-lg bg-slate-200" />
                  <div className="h-1 w-1 rounded-full bg-slate-200" />
                  <div className="flex-1">
                    <div className="h-4 w-32 rounded bg-slate-200" />
                    <div className="mt-1 h-3 w-20 rounded bg-slate-200" />
                  </div>
                  <div className="h-6 w-16 rounded-full bg-slate-200" />
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="lg:col-span-2">
          <div className="rounded-xl border bg-white">
            <div className="border-b bg-slate-50 px-5 py-3">
              <div className="h-4 w-28 rounded bg-slate-200" />
            </div>
            <div className="divide-y">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-5 py-3">
                  <div className="h-5 w-5 rounded-full bg-slate-200" />
                  <div className="flex-1">
                    <div className="h-4 w-40 rounded bg-slate-200" />
                    <div className="mt-1 h-3 w-24 rounded bg-slate-200" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
