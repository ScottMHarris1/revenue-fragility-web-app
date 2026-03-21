"use client";

export default function ScoreBars({ pillarScores, benchmarkBars, scorePillColor, cn }) {
  return (
    <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
      <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-2xl font-semibold tracking-tight">Architecture Breakdown</h3>
        <p className="mt-1 text-sm text-slate-600">
          Four-pillar view of the revenue system beneath growth.
        </p>

        <div className="mt-4 space-y-3">
          {pillarScores.map((pillar) => (
            <div key={pillar.name}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="font-medium text-slate-700">{pillar.name}</span>
                <span className="font-semibold text-slate-900">{pillar.score}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className={cn("h-full rounded-full", scorePillColor(pillar.score))}
                  style={{ width: `${pillar.score}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-2xl font-semibold tracking-tight">Benchmark View</h3>
        <p className="mt-1 text-sm text-slate-600">
          Position against a stronger operating profile.
        </p>

        <div className="mt-4 space-y-4">
          {benchmarkBars.map((item) => (
            <div key={item.label}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="font-medium text-slate-700">{item.label}</span>
                <span className="text-slate-500">Target: {item.target}%</span>
              </div>
              <div className="h-2 rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-slate-900"
                  style={{ width: `${item.current}%` }}
                />
              </div>
              <div className="mt-1 text-xs text-slate-500">Current: {item.current}%</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
