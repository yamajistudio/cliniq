type Props = {
  score: number; // 0-100
  showLabel?: boolean;
};

/** Maps a 0-100 score to a Tailwind gradient color stop. */
function scoreToColor(score: number): string {
  if (score >= 80) return "bg-red-500";
  if (score >= 60) return "bg-orange-500";
  if (score >= 35) return "bg-amber-400";
  return "bg-slate-400";
}

export default function LeadScoreBar({ score, showLabel = false }: Props) {
  const clamped = Math.min(100, Math.max(0, score));
  const barColor = scoreToColor(clamped);

  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-200">
        <div
          className={["h-full rounded-full transition-all", barColor].join(" ")}
          style={{ width: `${clamped}%` }}
          role="progressbar"
          aria-valuenow={clamped}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
      {showLabel && (
        <span className="w-8 flex-shrink-0 text-right text-xs font-medium text-slate-600">
          {clamped}
        </span>
      )}
    </div>
  );
}
