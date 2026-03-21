"use client";

export default function RiskMeter({ score, riskBand }) {
  const color =
    score >= 80
      ? "from-emerald-500 via-emerald-400 to-emerald-300"
      : score >= 65
        ? "from-amber-500 via-amber-400 to-amber-300"
        : "from-rose-500 via-rose-400 to-rose-300";

  const glow =
    score >= 80
      ? "shadow-[0_10px_30px_rgba(16,185,129,0.18)]"
      : score >= 65
        ? "shadow-[0_10px_30px_rgba(245,158,11,0.18)]"
        : "shadow-[0_10px_30px_rgba(244,63,94,0.18)]";

  return (
    <div className={`rounded-[28px] border border-white/70 bg-white/90 p-5 backdrop-blur ${glow}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
        Overall Fragility Score
      </p>

      <div className="mt-4 flex items-end gap-2">
        <div className="text-6xl font-semibold tracking-[-0.06em] text-slate-950">
          {score}
        </div>
        <div className="pb-2 text-sm text-slate-500">/100</div>
      </div>

      <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${color} transition-all duration-700`}
          style={{ width: `${score}%` }}
        />
      </div>

      <p className="mt-3 text-sm leading-6 text-slate-600">{riskBand}</p>
    </div>
  );
}
