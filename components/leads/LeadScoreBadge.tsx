"use client";

import { useState } from "react";
import { SCORE_CONFIG, SCORE_FACTOR_LABEL } from "@/services/lead-scoring.service";
import type { ScoreLabel } from "@/services/lead-scoring.service";

type Props = {
  score: number;
  label: ScoreLabel;
  factors?: Record<string, number>;
  size?: "sm" | "md";
};

export default function LeadScoreBadge({ score, label, factors = {}, size = "md" }: Props) {
  const [showTooltip, setShowTooltip] = useState(false);
  const config = SCORE_CONFIG[label] ?? SCORE_CONFIG.COLD;

  const hasFactors = Object.keys(factors).length > 0;
  const totalPoints = Object.values(factors).reduce((a, b) => a + b, 0);

  return (
    <div className="relative inline-flex">
      <button
        type="button"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onFocus={() => setShowTooltip(true)}
        onBlur={() => setShowTooltip(false)}
        className={[
          "inline-flex items-center gap-1 rounded-full font-semibold transition",
          size === "sm"
            ? "px-2 py-0.5 text-xs"
            : "px-3 py-1 text-sm",
          config.bgColor,
          config.color,
        ].join(" ")}
      >
        <span>{config.emoji}</span>
        <span>{score}</span>
        <span className="hidden sm:inline">· {config.label}</span>
      </button>

      {showTooltip && hasFactors && (
        <div
          className="absolute bottom-full left-1/2 z-50 mb-2 w-52 -translate-x-1/2 rounded-lg border border-slate-200 bg-white p-3 shadow-lg"
          role="tooltip"
        >
          <p className="mb-2 text-xs font-semibold text-slate-700">
            Score: {score} / 100
          </p>
          <div className="space-y-1">
            {Object.entries(factors).map(([key, pts]) => (
              <div key={key} className="flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  {SCORE_FACTOR_LABEL[key] ?? key}
                </span>
                <span
                  className={[
                    "text-xs font-medium",
                    pts > 0 ? "text-green-600" : "text-slate-400",
                  ].join(" ")}
                >
                  +{pts}
                </span>
              </div>
            ))}
          </div>
          {/* Caret */}
          <div className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-white" />
          <div className="absolute left-1/2 top-full -translate-x-1/2 translate-y-px border-4 border-transparent border-t-slate-200" />
        </div>
      )}
    </div>
  );
}
