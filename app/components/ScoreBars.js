"use client";

export default function ScoreBars({
  pillarScores,
  benchmarkBars,
  scorePillColor,
  cn,
}) {
  return (
    <div className="grid gap-8 xl:grid-cols-[1.15fr_0.85fr]">
      <div className="rounded-[32px] border border-white/70 bg-white/90 p-6 shadow-[0_12px_36px_rgba(15,23,42,0.06)] backdrop-blur">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-2xl font-semibold tracking-[-0.03em] text-slate-950">
              Architecture Breakdown
            </h3>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Four-pillar view of the revenue system beneath growth.
            </p>
          </div>

          <div className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
            Structural Scorecard
          </div>
        </div>

        <div className="mt-6 space-y-5">
          {pillarScores.map((pillar) => (
            <div
              key={pillar.name}
              className="rounded-[22px] border border-slate-100 bg-gradient-to-br from-slate-50 to-white p-4 shadow-sm"
            >
              <div className="mb-2 flex items-center justify-between gap-3">
                <span className="text-sm font-semibold text-slate-900">
                  {pillar.name}
                </span>
                <span className="text-sm font-semibold text-slate-700">
                  {pillar.score}/100
                </span>
              </div>

              <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-500",
                    scorePillColor(pillar.score)
                  )}
                  style={{ width: `${pillar.score}%` }}
                />
              </div>

              <div className="mt-2 flex justify-between text-[11px] uppercase tracking-wide text-slate-400">
                <span>Fragile</span>
                <span>Strengthening</span>
                <span>Durable</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-[32px] border border-white/70 bg-white/90 p-6 shadow-[0_12px_36px_rgba(15,23,42,0.06)] backdrop-blur">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-2xl font-semibold tracking-[-0.03em] text-slate-950">
              Benchmark View
            </h3>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Compare your current operating profile against a stronger target state.
            </p>
          </div>

          <div className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
            Current vs Target
          </div>
        </div>

        <div className="mt-6 space-y-5">
          {benchmarkBars.map((item) => {
            const progressWidth = `${Math.max(0, Math.min(100, item.current))}%`;
            const targetWidth = `${Math.max(0, Math.min(100, item.target))}%`;

            return (
              <div
                key={item.label}
                className="rounded-[22px] border border-slate-100 bg-gradient-to-br from-slate-50 to-white p-4 shadow-sm"
              >
                <div className="mb-2 flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold text-slate-900">
                    {item.label}
                  </span>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-slate-700">
                      {item.current}%
                    </div>
                    <div className="text-[11px] uppercase tracking-wide text-slate-400">
                      Target: {item.target}%
                    </div>
                  </div>
                </div>

                <div className="relative h-3 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-slate-900 transition-all duration-500"
                    style={{ width: progressWidth }}
                  />
                  <div
                    className="absolute top-0 h-full w-[2px] bg-rose-400"
                    style={{ left: targetWidth }}
                  />
                </div>

                <div className="mt-2 text-[11px] uppercase tracking-wide text-slate-400">
                  Dark bar = current state · red marker = target state
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
