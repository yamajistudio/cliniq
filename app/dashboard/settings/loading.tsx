export default function SettingsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div>
        <div className="h-8 w-44 rounded-lg bg-slate-200" />
        <div className="mt-2 h-4 w-56 rounded bg-slate-200" />
      </div>
      <div className="flex gap-1 rounded-lg border bg-slate-100 p-1">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-9 w-32 rounded-md bg-slate-200" />
        ))}
      </div>
      <div className="max-w-3xl rounded-xl border bg-white">
        <div className="border-b bg-slate-50 px-6 py-4">
          <div className="h-4 w-32 rounded bg-slate-200" />
        </div>
        <div className="space-y-4 p-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i}>
              <div className="h-3 w-24 rounded bg-slate-200" />
              <div className="mt-2 h-10 w-full rounded-lg bg-slate-200" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
