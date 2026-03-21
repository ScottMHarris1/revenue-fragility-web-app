"use client";

import { useEffect, useMemo, useState } from "react";
import { jsPDF } from "jspdf";
import {
  AlertTriangle,
  ArrowRight,
  BadgeDollarSign,
  BarChart3,
  Building2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Download,
  Gauge,
  Landmark,
  LayoutDashboard,
  LineChart,
  Loader2,
  RefreshCcw,
  ShieldAlert,
  Sparkles,
  TrendingDown,
  TrendingUp,
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

function revealClass(visible, delay = "") {
  return cn(
    "transition-all duration-700 ease-out",
    visible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0",
    delay
  );
}

export default function Page() {
  const [inputs, setInputs] = useState(defaultInputs);
  const [submitting, setSubmitting] = useState(false);
  const [saved, setSaved] = useState(false);
  const [step, setStep] = useState(1);
  const [resultsVisible, setResultsVisible] = useState(false);

  const result = useMemo(() => calculateAssessment(inputs), [inputs]);

  const benchmarkBars = [
    { label: "Concentration", current: inputs.top3AccountsPct, target: 30 },
    { label: "Founder", current: inputs.founderInfluencedRevenuePct, target: 25 },
    { label: "Forecast", current: inputs.forecastAccuracyPct, target: 90 },
    { label: "Margin", current: inputs.avgGrossMarginPct, target: 65 },
  ];

  const selfRecognitionPrompts = getQuestions();

  useEffect(() => {
    if (step === 2) {
      const t = setTimeout(() => setResultsVisible(true), 120);
      return () => clearTimeout(t);
    }
    setResultsVisible(false);
  }, [step]);

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

  function handleNextStep() {
    setStep(2);
  }

  function handlePrevStep() {
    setStep(1);
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
    setStep(1);
  }

  function handleLoadSample() {
    setInputs({
      companyName: "Sample Agency",
      workEmail: "founder@sampleagency.com",
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
    setStep(2);
  }

  const canContinueStep1 =
    inputs.companyName.trim().length > 0 &&
    inputs.workEmail.trim().length > 0 &&
    inputs.annualRevenue > 0;

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#eef2f7_100%)] text-slate-900">
      <div className="mx-auto max-w-[1500px] px-4 py-6 md:px-8">
        <section className="relative mb-6 overflow-hidden rounded-[32px] border border-slate-200/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(248,250,252,0.96)_100%)] px-6 py-7 shadow-[0_18px_50px_rgba(15,23,42,0.08)] md:px-8 md:py-8">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,1),_rgba(255,255,255,0))]" />
          <div className="pointer-events-none absolute -right-14 -top-14 h-40 w-40 rounded-full bg-rose-100/40 blur-3xl" />

          <div className="relative flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div className="max-w-4xl">
              <div className="mb-3 flex flex-wrap items-center gap-3">
                <div className="inline-flex h-11 items-center rounded-2xl border border-slate-200 bg-white px-4 shadow-sm">
                  <span className="text-sm font-semibold tracking-[-0.03em] text-slate-900">
                    Revenue Architecture™
                  </span>
                </div>
                <div className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-medium text-rose-700">
                  <Sparkles className="h-3.5 w-3.5" />
                  Built for founder-led agencies from $10M–$50M
                </div>
              </div>

              <h1 className="max-w-5xl text-[clamp(3rem,6vw,5.25rem)] font-semibold leading-[0.92] tracking-[-0.08em] text-slate-950">
                Is Your Revenue System Quietly Breaking Under Growth?
              </h1>

              <p className="mt-4 max-w-3xl text-[clamp(1.05rem,1.4vw,1.45rem)] leading-8 text-slate-600">
                A premium executive snapshot of unstable revenue, margin leakage,
                valuation pressure, and the structural risks beneath growth.
              </p>
            </div>

            <div className="flex shrink-0 flex-wrap items-center gap-3 xl:justify-end">
              <button
                onClick={handleLoadSample}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-md"
              >
                View Example Agency
              </button>

              <button
                onClick={handleReset}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-md"
              >
                <RefreshCcw className="h-4 w-4" />
                Reset
              </button>

              <button
                onClick={handleExportPdf}
                className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-6 py-2.5 text-sm font-semibold text-white shadow-[0_12px_26px_rgba(15,23,42,0.18)] transition duration-200 hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-[0_16px_34px_rgba(15,23,42,0.22)]"
              >
                <Download className="h-4 w-4" />
                Export PDF Preview
              </button>
            </div>
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-[390px_minmax(0,1fr)]">
          <aside className="relative overflow-hidden rounded-[30px] border border-slate-200/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(248,250,252,0.98)_100%)] p-6 shadow-[0_16px_40px_rgba(15,23,42,0.07)]">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,1),_rgba(255,255,255,0))]" />

            <div className="relative">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-md">
                  <LayoutDashboard className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold tracking-[-0.02em] text-slate-950">
                    Revenue Fragility Snapshot
                  </p>
                  <p className="text-xs text-slate-500">
                    Executive structural assessment
                  </p>
                </div>
              </div>

              <div className="mb-6 flex items-center gap-3">
                <StepPill number={1} active={step === 1} complete={step > 1} label="Company" />
                <div className="h-px flex-1 bg-slate-200" />
                <StepPill number={2} active={step === 2} complete={false} label="Signals" />
              </div>

              {step === 1 ? (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-[30px] font-semibold tracking-[-0.05em] text-slate-950">
                      Start the assessment
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      Enter the core company context to anchor the dashboard.
                    </p>
                  </div>

                  <div>
                    <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Company name
                    </label>
                    <input
                      value={inputs.companyName}
                      onChange={(e) => updateTextField("companyName", e.target.value)}
                      placeholder="Your Agency"
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none shadow-sm transition duration-200 hover:border-slate-300 hover:shadow-md focus:border-slate-900 focus:shadow-md"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Work email
                    </label>
                    <input
                      value={inputs.workEmail}
                      onChange={(e) => updateTextField("workEmail", e.target.value)}
                      placeholder="name@company.com"
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none shadow-sm transition duration-200 hover:border-slate-300 hover:shadow-md focus:border-slate-900 focus:shadow-md"
                    />
                  </div>

                  <NumberField
                    label="Annual revenue"
                    prefix="$"
                    value={inputs.annualRevenue}
                    onChange={(value) => updateNumberField("annualRevenue", value)}
                  />

                  <div className="rounded-[22px] border border-slate-200 bg-white/80 p-4 shadow-sm">
                    <div className="flex items-start gap-3">
                      <ShieldAlert className="mt-0.5 h-4 w-4 text-slate-500" />
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          Built for premium executive conversations
                        </p>
                        <p className="mt-1 text-sm leading-6 text-slate-600">
                          This tool identifies structural exposure quickly, then moves into
                          a full Revenue Architecture review if the pattern is real.
                        </p>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleNextStep}
                    disabled={!canContinueStep1}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white shadow-[0_12px_26px_rgba(15,23,42,0.18)] transition duration-200 hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-[0_16px_34px_rgba(15,23,42,0.22)] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Continue to Assessment
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-[30px] font-semibold tracking-[-0.05em] text-slate-950">
                        Structural inputs
                      </h2>
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        Capture the commercial signals driving structural fragility.
                      </p>
                    </div>

                    <button
                      onClick={handlePrevStep}
                      className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-md"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Back
                    </button>
                  </div>

                  <div className="grid grid-cols-2 items-start gap-3">
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
                    className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white shadow-[0_12px_26px_rgba(15,23,42,0.18)] transition duration-200 hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-[0_16px_34px_rgba(15,23,42,0.22)] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Saving Assessment
                      </>
                    ) : saved ? (
                      <>
                        <CheckCircle2 className="h-4 w-4" />
                        Assessment Saved
                      </>
                    ) : (
                      "Save Snapshot + Reveal Full Assessment"
                    )}
                  </button>

                  {saved && (
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
                      Assessment saved. Your snapshot is ready, and you can now book a Revenue
                      Architecture review.
                    </div>
                  )}

                  <div className="rounded-[22px] border border-slate-200 bg-white/80 p-4 shadow-sm">
                    <p className="text-sm font-semibold text-slate-900">
                      Self-recognition prompts
                    </p>

                    <div className="mt-3 space-y-3">
                      {selfRecognitionPrompts.map((prompt) => (
                        <div
                          key={prompt.id}
                          className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3"
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
              )}
            </div>
          </aside>

          <section className="space-y-6">
            <div className={revealClass(resultsVisible, "delay-[40ms]")}>
              <div className="grid gap-4 lg:grid-cols-[1.4fr_0.75fr]">
                <DashboardHeroCard
                  companyName={inputs.companyName || "Your Agency"}
                  profileType={result.profileType}
                  summary={result.summary}
                  riskBand={result.riskBand}
                />
                <div className="flex w-full max-w-[320px] flex-col gap-3 lg:ml-auto">
                  <RiskMeter score={result.overallScore} riskBand={result.riskBand} />
                </div>
              </div>
            </div>

            <div className={revealClass(resultsVisible, "delay-[100ms]")}>
              <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
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
                  icon={<Landmark className="h-5 w-5" />}
                  title="Enterprise Value Pressure"
                  value={`${formatCurrency(result.evCompressionLow)}–${formatCurrency(
                    result.evCompressionHigh
                  )}`}
                  subtitle="Estimated compressed enterprise value if uncorrected"
                  accent="slate"
                />
              </div>
            </div>

            <div className={revealClass(resultsVisible, "delay-[150ms]")}>
              <TopRibbon
                evLow={result.evCompressionLow}
                evHigh={result.evCompressionHigh}
                profileType={result.profileType}
                forecastAccuracy={inputs.forecastAccuracyPct}
              />
            </div>

            <div className={revealClass(resultsVisible, "delay-[220ms]")}>
              <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                <div className="rounded-[30px] border border-slate-200/70 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl bg-slate-950 p-2 text-white shadow-md">
                      <BarChart3 className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-semibold tracking-[-0.04em] text-slate-950">
                        Driver Analysis
                      </h3>
                      <p className="mt-1 text-sm leading-6 text-slate-600">
                        The structural constraints limiting your ability to scale predictably.
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-4 md:grid-cols-3">
                    {result.drivers.map((driver) => (
                      <div
                        key={driver.label}
                        className="rounded-[24px] border border-slate-100 bg-[linear-gradient(180deg,rgba(248,250,252,0.9)_0%,rgba(255,255,255,1)_100%)] p-5 shadow-sm"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="max-w-[180px] text-sm font-semibold leading-5 text-slate-900">
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

                <SignalsPanel
                  topRisks={result.topRisks}
                  revenueAtRisk={result.revenueAtRisk}
                  marginLeakage={result.marginLeakage}
                />
              </div>
            </div>

            <div className={revealClass(resultsVisible, "delay-[280ms]")}>
              <ScoreBars
                pillarScores={result.pillarScores}
                benchmarkBars={benchmarkBars}
                scorePillColor={scorePillColor}
                cn={cn}
              />
            </div>

            <div className={revealClass(resultsVisible, "delay-[340ms]")}>
              <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
                <div className="rounded-[30px] border border-slate-200/70 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
                  <h3 className="text-2xl font-semibold tracking-[-0.04em] text-slate-950">
                    Structural Interpretation
                  </h3>

                  <div className="mt-4 space-y-4 text-sm leading-7 text-slate-700">
                    <p>{result.summary}</p>
                    <p>{result.urgency}</p>
                    <p>
                      Most teams attempt to fix this with more pipeline, more hiring, or
                      more founder intervention. The issue is structural, not effort-driven.
                    </p>
                  </div>

                  <div className="mt-6 rounded-[24px] border border-slate-200 bg-slate-50/80 p-5">
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
                        className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(15,23,42,0.16)] transition duration-200 hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-[0_14px_30px_rgba(15,23,42,0.2)]"
                      >
                        Book Revenue Architecture Review
                        <ArrowRight className="h-4 w-4" />
                      </a>

                      <button
                        onClick={handleCopyTalkTrack}
                        className="rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-md"
                      >
                        Copy Live Demo Script
                      </button>
                    </div>

                    <p className="mt-3 text-xs leading-5 text-slate-500">
                      In 30 minutes, we’ll validate where this exposure is actually coming
                      from and whether it’s worth fixing now.
                    </p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="rounded-[30px] border border-slate-200/70 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
                    <h3 className="text-2xl font-semibold tracking-[-0.04em] text-slate-950">
                      What happens in the full diagnostic
                    </h3>
                    <div className="mt-4 space-y-3 text-sm leading-6 text-slate-700">
                      <DiagnosticStep index="01" text="Revenue mix, concentration, and margin review" />
                      <DiagnosticStep index="02" text="Founder and revenue leader interviews" />
                      <DiagnosticStep index="03" text="Four-pillar structural analysis" />
                      <DiagnosticStep index="04" text="Executive readout and 90-day stabilization roadmap" />
                    </div>
                  </div>

                  <div className="rounded-[30px] border border-slate-200/70 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
                    <h3 className="text-2xl font-semibold tracking-[-0.04em] text-slate-950">
                      Live demo talk track
                    </h3>
                    <p className="mt-4 text-sm leading-7 text-slate-700">
                      {result.liveDemoScript}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className={revealClass(resultsVisible, "delay-[400ms]")}>
              <div className="rounded-[22px] border border-slate-200/70 bg-white/80 px-4 py-3 text-center text-xs tracking-[0.08em] text-slate-500 shadow-sm">
                REVENUE FRAGILITY SNAPSHOT · REVENUE ARCHITECTURE™
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

function StepPill({ number, active, complete, label }) {
  return (
    <div className="flex items-center gap-2">
      <div
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition",
          complete
            ? "bg-slate-950 text-white"
            : active
              ? "bg-slate-900 text-white shadow-md"
              : "border border-slate-200 bg-white text-slate-500"
        )}
      >
        {number}
      </div>
      <span
        className={cn(
          "text-xs font-semibold uppercase tracking-[0.12em]",
          active || complete ? "text-slate-900" : "text-slate-400"
        )}
      >
        {label}
      </span>
    </div>
  );
}

function DashboardHeroCard({ companyName, profileType, summary, riskBand }) {
  return (
    <div className="relative overflow-hidden rounded-[30px] border border-slate-200/70 bg-[linear-gradient(135deg,#0f172a_0%,#111827_60%,#1e293b_100%)] p-6 text-white shadow-[0_18px_50px_rgba(15,23,42,0.18)]">
      <div className="pointer-events-none absolute -right-12 -top-10 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
      <div className="pointer-events-none absolute -left-10 bottom-0 h-32 w-32 rounded-full bg-rose-400/10 blur-3xl" />

      <div className="relative">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-white/80">
            <Sparkles className="h-3.5 w-3.5" />
            Executive Snapshot
          </div>
          <div className="inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-white/80">
            {riskBand}
          </div>
        </div>

        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/60">
          Assessment for
        </p>
        <h2 className="mt-2 text-3xl font-semibold tracking-[-0.05em]">
          {companyName}
        </h2>

        <div className="mt-4 inline-flex items-center rounded-full border border-white/15 bg-white/10 px-3 py-1 text-sm font-medium text-white/90">
          {profileType}
        </div>

        <p className="mt-5 max-w-2xl text-sm leading-7 text-white/75">{summary}</p>
      </div>
    </div>
  );
}

function TopRibbon({ evLow, evHigh, profileType, forecastAccuracy }) {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <RibbonCard
        icon={<Landmark className="h-4 w-4" />}
        label="Enterprise Value Exposure"
        value={`${formatCurrency(evLow)}–${formatCurrency(evHigh)}`}
        hint="Modeled structural compression if left uncorrected"
      />
      <RibbonCard
        icon={<Building2 className="h-4 w-4" />}
        label="Operating Profile"
        value={profileType}
        hint="Current revenue-system posture"
      />
      <RibbonCard
        icon={forecastAccuracy >= 80 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
        label="Forecast Signal"
        value={`${forecastAccuracy}% accuracy`}
        hint="Current visibility into the number"
      />
    </div>
  );
}

function RibbonCard({ icon, label, value, hint }) {
  return (
    <div className="rounded-[24px] border border-slate-200/70 bg-white p-4 shadow-[0_12px_30px_rgba(15,23,42,0.05)]">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
        {icon}
        {label}
      </div>
      <div className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-slate-950">
        {value}
      </div>
      <p className="mt-1 text-sm leading-6 text-slate-600">{hint}</p>
    </div>
  );
}

function SignalsPanel({ topRisks, revenueAtRisk, marginLeakage }) {
  return (
    <div className="rounded-[30px] border border-slate-200/70 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
      <div className="flex items-center gap-3">
        <div className="rounded-2xl bg-slate-950 p-2 text-white shadow-md">
          <ShieldAlert className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-2xl font-semibold tracking-[-0.04em] text-slate-950">
            Exposure Signals
          </h3>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            The clearest patterns surfaced by the current model.
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-3">
        {topRisks.map((risk) => (
          <div
            key={risk}
            className="rounded-[20px] border border-slate-100 bg-slate-50/80 p-4 text-sm leading-6 text-slate-700"
          >
            {risk}
          </div>
        ))}
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <MiniStat label="Revenue at risk" value={formatCurrency(revenueAtRisk)} />
        <MiniStat label="Margin leakage" value={formatCurrency(marginLeakage)} />
      </div>
    </div>
  );
}

function MiniStat({ label, value }) {
  return (
    <div className="rounded-[20px] border border-slate-100 bg-[linear-gradient(180deg,rgba(248,250,252,0.9)_0%,rgba(255,255,255,1)_100%)] p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-slate-950">
        {value}
      </p>
    </div>
  );
}

function DiagnosticStep({ index, text }) {
  return (
    <div className="flex items-start gap-3 rounded-[20px] border border-slate-100 bg-slate-50/80 p-4">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-950 text-xs font-semibold text-white">
        {index}
      </div>
      <p className="pt-1 text-sm leading-6 text-slate-700">{text}</p>
    </div>
  );
}

function MetricCard({ title, value, subtitle, accent, icon }) {
  const accents = {
    rose: "border-rose-100 bg-[linear-gradient(180deg,rgba(255,241,242,0.95)_0%,rgba(255,255,255,1)_100%)]",
    amber: "border-amber-100 bg-[linear-gradient(180deg,rgba(255,251,235,0.95)_0%,rgba(255,255,255,1)_100%)]",
    yellow: "border-yellow-100 bg-[linear-gradient(180deg,rgba(254,252,232,0.95)_0%,rgba(255,255,255,1)_100%)]",
    slate: "border-slate-100 bg-[linear-gradient(180deg,rgba(248,250,252,0.95)_0%,rgba(255,255,255,1)_100%)]",
  };

  return (
    <div
      className={cn(
        "flex min-h-[220px] flex-col rounded-[28px] border p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_16px_30px_rgba(15,23,42,0.08)]",
        accents[accent]
      )}
    >
      <div className="flex min-h-[56px] items-start gap-3 text-sm font-medium text-slate-700">
        <div className="mt-0.5 rounded-xl bg-white p-2 shadow-sm ring-1 ring-slate-100">
          {icon}
        </div>
        <div className="max-w-[180px] leading-6">{title}</div>
      </div>

      <div className="mt-6 break-words text-[clamp(2rem,2.2vw,3rem)] font-semibold leading-[0.95] tracking-[-0.06em] text-slate-950">
        {value}
      </div>

      <p className="mt-4 text-sm leading-6 text-slate-600">{subtitle}</p>
    </div>
  );
}

function NumberField({ label, value, onChange, prefix, suffix }) {
  return (
    <div className="flex flex-col">
      <label className="mb-2 min-h-[36px] text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
        {label}
      </label>

      <div className="group flex h-[54px] items-center rounded-2xl border border-slate-200 bg-white px-3 py-3 shadow-sm transition duration-200 hover:border-slate-300 hover:shadow-md focus-within:border-slate-900 focus-within:shadow-md">
        {prefix ? <span className="mr-2 shrink-0 text-sm text-slate-500">{prefix}</span> : null}

        <input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="min-w-0 flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
        />

        {suffix ? <span className="ml-2 shrink-0 text-sm text-slate-500">{suffix}</span> : null}
      </div>
    </div>
  );
}
