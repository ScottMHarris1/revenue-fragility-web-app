"use client";

import { useMemo, useState } from "react";
import { jsPDF } from "jspdf";
import {
  AlertTriangle,
  ArrowRight,
  BadgeDollarSign,
  Building2,
  Download,
  Gauge,
  LineChart,
  Loader2,
  RefreshCcw,
} from "lucide-react";
import {
  calculateAssessment,
  buildExportNarrative,
  formatCurrency,
  getQuestions,
} from "../lib/fragility";
import ScoreBars from "./components/ScoreBars";
import RiskMeter from "./components/RiskMeter";

const defaultInputs = {
  companyName: "",
  workEmail: "",
  annualRevenue: 30000000,
  top3AccountsPct: 35,
  avgGrossMarginPct: 58,
  targetMarginPct: 65,
  founderInfluencedRevenuePct: 50,
  forecastAccuracyPct: 70,
  sellersCount: 12,
  managersCount: 3,
};

const bookingUrl =
  process.env.NEXT_PUBLIC_BOOKING_URL || "https://calendly.com/your-link";

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

function scorePillColor(score) {
  if (score >= 80) return "bg-emerald-500";
  if (score >= 65) return "bg-amber-500";
  return "bg-rose-500";
}

function severityChip(severity) {
  if (severity === "High") return "bg-rose-50 text-rose-700 border border-rose-200";
  if (severity === "Moderate") return "bg-amber-50 text-amber-700 border border-amber-200";
  return "bg-emerald-50 text-emerald-700 border border-emerald-200";
}

function riskBandChip(riskBand) {
  if (riskBand.includes("Low")) {
    return "bg-emerald-50 text-emerald-700 border border-emerald-200";
  }
  if (riskBand.includes("Moderate")) {
    return "bg-amber-50 text-amber-700 border border-amber-200";
  }
  return "bg-rose-50 text-rose-700 border border-rose-200";
}

export default function Page() {
  const [inputs, setInputs] = useState(defaultInputs);
  const [submitting, setSubmitting] = useState(false);
  const [saved, setSaved] = useState(false);

  const result = useMemo(() => calculateAssessment(inputs), [inputs]);

  const benchmarkBars = [
    { label: "Concentration", current: inputs.top3AccountsPct, target: 30 },
    { label: "Founder", current: inputs.founderInfluencedRevenuePct, target: 25 },
    { label: "Forecast", current: inputs.forecastAccuracyPct, target: 90 },
    { label: "Margin", current: inputs.avgGrossMarginPct, target: 65 },
  ];

  const selfRecognitionPrompts = getQuestions();

  function updateNumberField(key, value) {
    setInputs((prev) => ({
      ...prev,
      [key]: value === "" ? 0 : Number(value),
    }));
  }

  function updateTextField(key, value) {
    setInputs((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  async function handleSaveLead() {
    setSubmitting(true);
    setSaved(false);

    try {
      const utmSource =
        typeof window !== "undefined"
          ? new URLSearchParams(window.location.search).get("utm_source") || ""
          : "";

      const payload = {
        ...inputs,
        ...result,
        source: "Revenue Fragility Snapshot",
        utmSource,
      };

      const res = await fetch("/api/assessment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok || !json.ok) {
        throw new Error(json.error || "Failed to save assessment.");
      }

      setSaved(true);
    } catch (error) {
      console.error(error);
      alert(error?.message || "Something went wrong while saving the assessment.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleExportPdf() {
    const doc = new jsPDF({
      unit: "pt",
      format: "letter",
    });

    const margin = 48;
    const pageWidth = 612;
    let y = 56;

    const addWrappedText = (text, x, currentY, width, lineHeight = 18) => {
      const lines = doc.splitTextToSize(text, width);
      doc.text(lines, x, currentY);
      return currentY + lines.length * lineHeight;
    };

    doc.setFont("helvetica", "bold");
    doc.setFontSize(24);
    doc.text("Revenue Fragility Snapshot", margin, y);

    y += 28;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    y = addWrappedText(
      `Assessment for ${inputs.companyName || "Your Agency"} | ${new Date().toLocaleDateString()}`,
      margin,
      y,
      pageWidth - margin * 2
    );

    y += 6;
    doc.setDrawColor(229, 231, 235);
    doc.line(margin, y, pageWidth - margin, y);
    y += 28;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text(`${result.overallScore}/100`, margin, y);
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(`Overall Fragility Score | ${result.riskBand}`, margin + 84, y);

    y += 28;
    doc.setFont("helvetica", "bold");
    doc.text(`Profile Type: ${result.profileType}`, margin, y);

    y += 24;
    doc.setFont("helvetica", "bold");
    doc.text("Financial Exposure", margin, y);

    y += 18;
    doc.setFont("helvetica", "normal");
    y = addWrappedText(
      `Potentially unstable revenue: ${formatCurrency(
        result.revenueAtRisk
      )}\nAnnualized margin leakage: ${formatCurrency(
        result.marginLeakage
      )}\nEstimated compressed enterprise value: ${formatCurrency(
        result.evCompressionLow
      )} to ${formatCurrency(result.evCompressionHigh)}`,
      margin,
      y,
      pageWidth - margin * 2
    );

    y += 12;
    doc.setFont("helvetica", "bold");
    doc.text("Top Structural Risks", margin, y);
    y += 18;
    doc.setFont("helvetica", "normal");

    result.topRisks.forEach((risk) => {
      y = addWrappedText(`• ${risk}`, margin, y, pageWidth - margin * 2);
    });

    y += 12;
    doc.setFont("helvetica", "bold");
    doc.text("Interpretation", margin, y);
    y += 18;
    doc.setFont("helvetica", "normal");
    y = addWrappedText(
      buildExportNarrative(inputs, result),
      margin,
      y,
      pageWidth - margin * 2
    );

    y += 12;
    doc.setFont("helvetica", "bold");
    doc.text("Recommended Next Step", margin, y);
    y += 18;
    doc.setFont("helvetica", "normal");
    y = addWrappedText(
      result.recommendedNextStep,
      margin,
      y,
      pageWidth - margin * 2
    );

    y += 12;
    doc.setFont("helvetica", "bold");
    doc.text("What Happens in the Full Diagnostic", margin, y);
    y += 18;
    doc.setFont("helvetica", "normal");
    y = addWrappedText(
      `1. Revenue mix, concentration, and margin review
2. Founder and revenue leader interviews
3. Four-pillar structural analysis
4. Executive readout and 90-day stabilization roadmap`,
      margin,
      y,
      pageWidth - margin * 2
    );

    y += 12;
    doc.setFont("helvetica", "bold");
    doc.text("Live Demo Talk Track", margin, y);
    y += 18;
    doc.setFont("helvetica", "normal");
    addWrappedText(result.liveDemoScript, margin, y, pageWidth - margin * 2);

    doc.save(
      `${(inputs.companyName || "your-agency")
        .toLowerCase()
        .replace(/\s+/g, "-")}-revenue-fragility-snapshot.pdf`
    );
  }

  function handleCopyTalkTrack() {
    navigator.clipboard.writeText(result.liveDemoScript);
  }

  function handleReset() {
    setInputs(defaultInputs);
    setSaved(false);
  }

  function handleLoadSample() {
    setInputs({
      companyName: "Sample Agency",
      workEmail: "",
      annualRevenue: 25000000,
      top3AccountsPct: 41,
      avgGrossMarginPct: 54,
      targetMarginPct: 65,
      founderInfluencedRevenuePct: 48,
      forecastAccuracyPct: 72,
      sellersCount: 10,
      managersCount: 2,
    });
    setSaved(false);
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#ffffff_0%,_#f8fafc_35%,_#eef2f7_100%)] text-slate-900">
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-8">
        <section className="rounded-[32px] border border-white/60 bg-white/80 p-6 shadow-[0_10px_40px_rgba(15,23,42,0.08)] backdrop-blur md:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div className="max-w-4xl">
              <div className="mb-3 flex flex-wrap gap-2">
                <div className="inline-flex rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 shadow-sm">
                  Revenue Architecture
                </div>
                <div className="inline-flex rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-medium text-rose-700">
                  Built for founder-led agencies from $10M–$50M
                </div>
              </div>

              <h1 className="text-4xl font-semibold tracking-[-0.04em] text-slate-950 md:text-6xl">
                Is Your Revenue System Quietly Breaking Under Growth?
              </h1>

              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 md:text-lg">
                Most agencies don’t see structural fragility until it’s already expensive.
                Quantify unstable revenue, margin leakage, valuation pressure, and the
                operating risks beneath growth.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={handleLoadSample}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-50"
              >
                Load Sample
              </button>

              <button
                onClick={handleReset}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-50"
              >
                <RefreshCcw className="h-4 w-4" />
                Reset
              </button>

              <button
                onClick={handleExportPdf}
                className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(15,23,42,0.15)] transition hover:-translate-y-0.5 hover:bg-slate-800"
              >
                <Download className="h-4 w-4" />
                Export PDF Preview
              </button>
            </div>
          </div>
        </section>

        <div className="mt-8 grid gap-8 xl:grid-cols-[360px_minmax(0,1fr)]">
          <aside className="rounded-[30px] border border-white/70 bg-white/85 p-6 shadow-[0_8px_30px_rgba(15,23,42,0.06)] backdrop-blur">
            <div className="mb-5">
              <h2 className="text-2xl font-semibold tracking-[-0.03em] text-slate-950">
                Assessment Inputs
              </h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Capture the commercial signals creating structural exposure.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Company name
                </label>
                <input
                  value={inputs.companyName}
                  onChange={(e) => updateTextField("companyName", e.target.value)}
                  placeholder="Your Agency"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-900"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Work email
                </label>
                <input
                  value={inputs.workEmail}
                  onChange={(e) => updateTextField("workEmail", e.target.value)}
                  placeholder="name@company.com"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <NumberField
                  label="Annual revenue"
                  prefix="$"
                  value={inputs.annualRevenue}
                  onChange={(value) => updateNumberField("annualRevenue", value)}
                />
                <NumberField
                  label="Revenue in top 3 clients"
                  suffix="%"
                  value={inputs.top3AccountsPct}
                  onChange={(value) => updateNumberField("top3AccountsPct", value)}
                />
                <NumberField
                  label="Avg gross margin"
                  suffix="%"
                  value={inputs.avgGrossMarginPct}
                  onChange={(value) => updateNumberField("avgGrossMarginPct", value)}
                />
                <NumberField
                  label="Target margin"
                  suffix="%"
                  value={inputs.targetMarginPct}
                  onChange={(value) => updateNumberField("targetMarginPct", value)}
                />
                <NumberField
                  label="Revenue requiring founder involvement"
                  suffix="%"
                  value={inputs.founderInfluencedRevenuePct}
                  onChange={(value) =>
                    updateNumberField("founderInfluencedRevenuePct", value)
                  }
                />
                <NumberField
                  label="Current forecast accuracy"
                  suffix="%"
                  value={inputs.forecastAccuracyPct}
                  onChange={(value) => updateNumberField("forecastAccuracyPct", value)}
                />
                <NumberField
                  label="# of sellers"
                  value={inputs.sellersCount}
                  onChange={(value) => updateNumberField("sellersCount", value)}
                />
                <NumberField
                  label="# of managers"
                  value={inputs.managersCount}
                  onChange={(value) => updateNumberField("managersCount", value)}
                />
              </div>

              <button
                onClick={handleSaveLead}
                disabled={submitting || !inputs.workEmail}
                className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(15,23,42,0.12)] transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving Assessment
                  </>
                ) : saved ? (
                  "Assessment Saved"
                ) : (
                  "Get My Assessment"
                )}
              </button>

              {saved && (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
                  Assessment saved. Your snapshot is ready, and you can now book a Revenue
                  Architecture review.
                </div>
              )}

              <div className="rounded-[24px] border border-slate-200 bg-slate-50/80 p-4">
                <p className="text-sm font-semibold text-slate-900">
                  Self-recognition prompts
                </p>

                <div className="mt-3 space-y-3">
                  {selfRecognitionPrompts.map((prompt) => (
                    <div
                      key={prompt.id}
                      className="rounded-2xl border border-slate-100 bg-white p-3 shadow-sm"
                    >
                      <p className="text-sm font-medium text-slate-900">{prompt.label}</p>
                      <p className="mt-1 text-xs leading-5 text-slate-600">
                        {prompt.helper}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          <section className="space-y-8">
            <div className="rounded-[30px] border border-white/70 bg-white/85 p-6 shadow-[0_8px_30px_rgba(15,23,42,0.06)] backdrop-blur">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="max-w-3xl">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Assessment for
                  </p>
                  <h2 className="mt-1 text-3xl font-semibold tracking-[-0.03em] text-slate-950 md:text-4xl">
                    {inputs.companyName || "Your Agency"}
                  </h2>
                  <p className="mt-2 text-sm text-slate-600">
                    Profile type:{" "}
                    <span className="font-semibold text-slate-900">{result.profileType}</span>
                  </p>
                  <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-700">
                    {result.summary}
                  </p>
                </div>

                <div className="flex w-full max-w-[280px] flex-col gap-3">
                  <span
                    className={cn(
                      "inline-flex self-start rounded-full px-3 py-1 text-xs font-semibold",
                      riskBandChip(result.riskBand)
                    )}
                  >
                    {result.riskBand}
                  </span>

                  <RiskMeter score={result.overallScore} riskBand={result.riskBand} />
                </div>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <MetricCard
                  icon={<BadgeDollarSign className="h-5 w-5" />}
                  title="Potentially Unstable Revenue"
                  value={formatCurrency(result.revenueAtRisk)}
                  subtitle="Revenue exposed to concentration, forecast volatility, and founder dependency"
                  accent="rose"
                />
                <MetricCard
                  icon={<LineChart className="h-5 w-5" />}
                  title="Margin Leakage"
                  value={formatCurrency(result.marginLeakage)}
                  subtitle="Annualized gap versus target operating profile"
                  accent="amber"
                />
                <MetricCard
                  icon={<Gauge className="h-5 w-5" />}
                  title="Predictability Score"
                  value={`${result.predictabilityScore}/100`}
                  subtitle="System-level ability to forecast and scale reliably"
                  accent="yellow"
                />
                <MetricCard
                  icon={<Building2 className="h-5 w-5" />}
                  title="Enterprise Value Pressure"
                  value={`${formatCurrency(result.evCompressionLow)}–${formatCurrency(
                    result.evCompressionHigh
                  )}`}
                  subtitle="Estimated compressed enterprise value if uncorrected"
                  accent="slate"
                />
              </div>

              <div className="mt-5 rounded-[24px] border border-slate-100 bg-slate-50/70 p-4">
                <p className="text-sm leading-6 text-slate-700">
                  Based on your inputs, this revenue system may be compressing enterprise
                  value by{" "}
                  <span className="font-semibold text-slate-950">
                    {formatCurrency(result.evCompressionLow)} to{" "}
                    {formatCurrency(result.evCompressionHigh)}
                  </span>{" "}
                  if left structurally uncorrected.
                </p>
              </div>
            </div>

            <div className="rounded-[30px] border border-white/70 bg-white/85 p-6 shadow-[0_8px_30px_rgba(15,23,42,0.06)] backdrop-blur">
              <h3 className="text-2xl font-semibold tracking-[-0.03em] text-slate-950">
                Driver Analysis
              </h3>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                These are the structural constraints limiting your ability to scale
                predictably.
              </p>

              <div className="mt-5 grid gap-4 md:grid-cols-3">
                {result.drivers.map((driver) => (
                  <div
                    key={driver.label}
                    className="rounded-[26px] border border-slate-100 bg-gradient-to-br from-slate-50 to-white p-5 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="max-w-[170px] text-sm font-semibold leading-5 text-slate-900">
                        {driver.label}
                      </p>
                      <span
                        className={cn(
                          "rounded-full px-2.5 py-1 text-[11px] font-semibold",
                          severityChip(driver.severity)
                        )}
                      >
                        {driver.severity}
                      </span>
                    </div>

                    <p className="mt-4 text-4xl font-semibold tracking-[-0.03em] text-slate-950">
                      {driver.value}%
                    </p>

                    <p className="mt-2 text-xs font-medium uppercase tracking-wide text-slate-500">
                      {driver.benchmark}
                    </p>

                    <p className="mt-3 text-sm leading-6 text-slate-600">
                      {driver.explanation}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <ScoreBars
              pillarScores={result.pillarScores}
              benchmarkBars={benchmarkBars}
              scorePillColor={scorePillColor}
              cn={cn}
            />

            <div className="grid gap-8 xl:grid-cols-[1.2fr_0.8fr]">
              <div className="space-y-8">
                <div className="rounded-[30px] border border-white/70 bg-white/85 p-6 shadow-[0_8px_30px_rgba(15,23,42,0.06)] backdrop-blur">
                  <h3 className="text-2xl font-semibold tracking-[-0.03em] text-slate-950">
                    Structural Interpretation
                  </h3>

                  <div className="mt-4 space-y-4 text-sm leading-7 text-slate-700">
                    <p>{result.summary}</p>
                    <p>{result.urgency}</p>
                    <p>
                      Most teams attempt to fix this with more pipeline, more hiring, or
                      more founder intervention. The issue is structural, not
                      effort-driven.
                    </p>
                  </div>

                  <div className="mt-6 rounded-[26px] border border-slate-200 bg-slate-50/80 p-5">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-slate-700" />
                      <p className="text-sm font-semibold text-slate-900">
                        Recommended next step
                      </p>
                    </div>

                    <p className="mt-3 text-sm leading-6 text-slate-700">
                      {result.recommendedNextStep}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-3">
                      <a
                        href={bookingUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(15,23,42,0.15)] transition hover:-translate-y-0.5 hover:bg-slate-800"
                      >
                        Book Revenue Architecture Review
                        <ArrowRight className="h-4 w-4" />
                      </a>

                      <button
                        onClick={handleCopyTalkTrack}
                        className="rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-50"
                      >
                        Copy Live Demo Script
                      </button>
                    </div>

                    <p className="mt-3 text-xs leading-5 text-slate-500">
                      In 30 minutes, we’ll validate where this exposure is actually coming
                      from and whether it’s worth fixing now.
                    </p>
                  </div>

                  <div className="mt-6 rounded-[26px] border border-slate-100 bg-gradient-to-br from-slate-50 to-white p-5 shadow-sm">
                    <p className="text-sm font-semibold text-slate-900">
                      What happens in the full diagnostic
                    </p>
                    <div className="mt-3 space-y-2 text-sm leading-6 text-slate-700">
                      <p>1. Revenue mix, concentration, and margin review</p>
                      <p>2. Founder and revenue leader interviews</p>
                      <p>3. Four-pillar structural analysis</p>
                      <p>4. Executive readout and 90-day stabilization roadmap</p>
                    </div>
                  </div>

                  <div className="mt-6 rounded-[26px] border border-slate-100 bg-gradient-to-br from-slate-50 to-white p-5 shadow-sm">
                    <p className="text-sm font-semibold text-slate-900">
                      Live demo talk track
                    </p>
                    <p className="mt-3 text-sm leading-7 text-slate-700">
                      {result.liveDemoScript}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-8">
                <div className="rounded-[30px] border border-white/70 bg-white/85 p-6 shadow-[0_8px_30px_rgba(15,23,42,0.06)] backdrop-blur">
                  <h3 className="text-2xl font-semibold tracking-[-0.03em] text-slate-950">
                    Top Risks
                  </h3>

                  <div className="mt-4 space-y-3">
                    {result.topRisks.map((risk) => (
                      <div
                        key={risk}
                        className="rounded-[22px] border border-slate-100 bg-gradient-to-br from-slate-50 to-white p-4 text-sm leading-6 text-slate-700 shadow-sm"
                      >
                        {risk}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-[30px] border border-white/70 bg-white/85 p-6 shadow-[0_8px_30px_rgba(15,23,42,0.06)] backdrop-blur">
                  <h3 className="text-2xl font-semibold tracking-[-0.03em] text-slate-950">
                    Action Trigger
                  </h3>

                  <p className="mt-3 text-sm leading-6 text-slate-700">
                    This snapshot is designed to identify whether growth is being supported
                    by durable revenue architecture — or whether fragility is accumulating
                    beneath the numbers.
                  </p>

                  <p className="mt-3 text-sm leading-6 text-slate-700">
                    The full diagnostic validates where that exposure is actually coming
                    from across concentration, manager accountability, coverage, and margin
                    construction.
                  </p>
                </div>
              </div>
            </div>

            <p className="pb-2 text-center text-xs text-slate-500">
              v2.1 – Revenue Fragility Snapshot
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}

function MetricCard({ title, value, subtitle, accent, icon }) {
  const accents = {
    rose: "border-rose-100 bg-gradient-to-br from-rose-50 to-white",
    amber: "border-amber-100 bg-gradient-to-br from-amber-50 to-white",
    yellow: "border-yellow-100 bg-gradient-to-br from-yellow-50 to-white",
    slate: "border-slate-100 bg-gradient-to-br from-slate-50 to-white",
  };

  return (
    <div className={cn("rounded-[26px] border p-5 shadow-sm", accents[accent])}>
      <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
        {icon}
        {title}
      </div>
      <div className="mt-4 text-4xl font-semibold tracking-[-0.03em] text-slate-950">
        {value}
      </div>
      <p className="mt-2 text-sm leading-6 text-slate-600">{subtitle}</p>
    </div>
  );
}

function NumberField({ label, value, onChange, prefix, suffix }) {
  return (
    <div>
      <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </label>
      <div className="flex items-center rounded-2xl border border-slate-200 bg-white px-3 py-3 shadow-sm">
        {prefix ? <span className="mr-2 text-sm text-slate-500">{prefix}</span> : null}
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-transparent text-sm outline-none"
        />
        {suffix ? <span className="ml-2 text-sm text-slate-500">{suffix}</span> : null}
      </div>
    </div>
  );
}
