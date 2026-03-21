"use client";

export default function RiskMeter({ score, riskBand }) {
  const color =
    score >= 80
      ? "from-emerald-500 to-emerald-300"
      : score >= 65
        ? "from-amber-500 to-amber-300"
        : "from-rose-500 to-rose-300";

  return (
    <div className="rounded-[30px] border border-white/70 bg-white/85 p-6 shadow-[0_8px_30px_rgba(15,23,42,0.06)] backdrop-blur">
      <p className="text-sm font-medium text-slate-500">Overall Fragility Score</p>
      <div className="mt-3 flex items-end gap-3">
        <div className="text-6xl font-semibold tracking-[-0.05em] text-slate-950">
          {score}
        </div>
        <div className="pb-2 text-sm text-slate-500">/100</div>
      </div>

      <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${color}`}
          style={{ width: `${score}%` }}
        />
      </div>

      <p className="mt-3 text-sm leading-6 text-slate-600">{riskBand}</p>
    </div>
  );
}
