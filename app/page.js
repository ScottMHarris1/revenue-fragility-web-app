"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import jsPDF from "jspdf";
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

const RadarChart = dynamic(() => import("recharts").then((m) => m.RadarChart), { ssr: false });
const PolarGrid = dynamic(() => import("recharts").then((m) => m.PolarGrid), { ssr: false });
const PolarAngleAxis = dynamic(() => import("recharts").then((m) => m.PolarAngleAxis), { ssr: false });
const PolarRadiusAxis = dynamic(() => import("recharts").then((m) => m.PolarRadiusAxis), { ssr: false });
const Radar = dynamic(() => import("recharts").then((m) => m.Radar), { ssr: false });
const ResponsiveContainer = dynamic(() => import("recharts").then((m) => m.ResponsiveContainer), { ssr: false });
const BarChart = dynamic(() => import("recharts").then((m) => m.BarChart), { ssr: false });
const Bar = dynamic(() => import("recharts").then((m) => m.Bar), { ssr: false });
const XAxis = dynamic(() => import("recharts").then((m) => m.XAxis), { ssr: false });
const YAxis = dynamic(() => import("recharts").then((m) => m.YAxis), { ssr: false });
const Tooltip = dynamic(() => import("recharts").then((m) => m.Tooltip), { ssr: false });

const defaultInputs = {
  companyName: "Example Agency",
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
  if (riskBand.includes("Low")) return "bg-emerald-50 text-emerald-700 border border-emerald-200";
  if (riskBand.includes("Moderate")) return "bg-amber-50 text-amber-700 border border-amber-200";
  return "bg-rose-50 text-rose-700 border border-rose-200";
}

export default function Page() {
  const [inputs, setInputs] = useState(defaultInputs);
  const [submitting, setSubmitting] = useState(false);
  const [saved, setSaved] = useState(false);

  const result = useMemo(() => calculateAssessment(inputs), [inputs]);

  const radarData = result.pillarScores.map((item) => ({
    subject: item.name.replace("Revenue ", ""),
    score: item.score,
  }));

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
      const payload = {
        ...inputs,
        ...result,
        source: "Revenue Fragility Snapshot",
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
      alert(error.message || "Something went wrong while saving the assessment.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleExportPdf() {
    const doc = new jsPDF({ unit: "pt", format: "letter" });
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
      `Assessment for ${inputs.companyName} | ${new Date().toLocaleDateString()}`,
      margin,
      y,
      pageWidth - margin * 2
    );

    y += 6;
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

    doc.save(
      `${inputs.companyName.toLowerCase().replace(/\s+/g, "-")}-revenue-fragility-snapshot.pdf`
    );
  }

  function handleCopyTalkTrack() {
    navigator.clipboard.writeText(result.liveDemoScript);
  }

  function handleReset() {
    setInputs(defaultInputs);
    setSaved(false);
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div className="max-w-3xl">
              <div className="mb-3 inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
                Revenue Architecture
              </div>
              <h1 className="text-3xl font-semibold tracking-tight md:text-5xl">
                Is Your Revenue System Quietly Breaking Under Growth?
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 md:text-base">
                Most agencies do not see structural fragility until it is already expensive.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleReset}
                className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700"
              >
                <RefreshCcw className="h-4 w-4" />
                Reset
              </button>
              <button
                onClick={handleExportPdf}
                className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-2 text-sm font-medium text-white"
              >
                <Download className="h-4 w-4" />
                Export PDF Preview
              </button>
            </div>
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
          <aside className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5">
              <h2 className="text-2xl font-semibold tracking-tight">Assessment Inputs</h2>
            </div>

            <div className="space-y-4">
              <input
                value={inputs.companyName}
                onChange={(e) => updateTextField("companyName", e.target.value)}
                placeholder="Company name"
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm"
              />
              <input
                value={inputs.workEmail}
                onChange={(e) => updateTextField("workEmail", e.target.value)}
                placeholder="Work email"
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm"
              />

              <NumberField label="Annual revenue" prefix="$" value={inputs.annualRevenue} onChange={(v) => updateNumberField("annualRevenue", v)} />
              <NumberField label="Top 3 accounts" suffix="%" value={inputs.top3AccountsPct} onChange={(v) => updateNumberField("top3AccountsPct", v)} />
              <NumberField label="Avg gross margin" suffix="%" value={inputs.avgGrossMarginPct} onChange={(v) => updateNumberField("avgGrossMarginPct", v)} />
              <NumberField label="Target margin" suffix="%" value={inputs.targetMarginPct} onChange={(v) => updateNumberField("targetMarginPct", v)} />
              <NumberField label="Founder influenced revenue" suffix="%" value={inputs.founderInfluencedRevenuePct} onChange={(v) => updateNumberField("founderInfluencedRevenuePct", v)} />
              <NumberField label="Forecast accuracy" suffix="%" value={inputs.forecastAccuracyPct} onChange={(v) => updateNumberField("forecastAccuracyPct", v)} />
              <NumberField label="# of sellers" value={inputs.sellersCount} onChange={(v) => updateNumberField("sellersCount", v)} />
              <NumberField label="# of managers" value={inputs.managersCount} onChange={(v) => updateNumberField("managersCount", v)} />

              <button
                onClick={handleSaveLead}
                disabled={submitting || !inputs.workEmail}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
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

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900">Self-recognition prompts</p>
                <div className="mt-3 space-y-3">
                  {selfRecognitionPrompts.map((prompt) => (
                    <div key={prompt.id} className="rounded-2xl bg-white p-3 shadow-sm">
                      <p className="text-sm font-medium text-slate-900">{prompt.label}</p>
                      <p className="mt-1 text-xs leading-5 text-slate-600">{prompt.helper}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          <section className="space-y-6">
            <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Assessment for
                  </p>
                  <h2 className="text-3xl font-semibold tracking-tight">{inputs.companyName}</h2>
                  <p className="mt-2 text-sm text-slate-600">
                    Profile type: <span className="font-semibold text-slate-900">{result.profileType}</span>
                  </p>
                </div>

                <span className={cn("inline-flex self-start rounded-full px-3 py-1 text-xs font-semibold", riskBandChip(result.riskBand))}>
                  {result.riskBand}
                </span>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-4">
                <MetricCard icon={<BadgeDollarSign className="h-5 w-5" />} title="Potentially Unstable Revenue" value={formatCurrency(result.revenueAtRisk)} subtitle="Revenue exposed to structural instability" accent="rose" />
                <MetricCard icon={<LineChart className="h-5 w-5" />} title="Margin Leakage" value={formatCurrency(result.marginLeakage)} subtitle="Gap vs target margin profile" accent="amber" />
                <MetricCard icon={<Gauge className="h-5 w-5" />} title="Predictability Score" value={`${result.predictabilityScore}/100`} subtitle="Ability to scale and forecast reliably" accent="yellow" />
                <MetricCard icon={<Building2 className="h-5 w-5" />} title="Enterprise Value Pressure" value={`${formatCurrency(result.evCompressionLow)}–${formatCurrency(result.evCompressionHigh)}`} subtitle="Estimated valuation compression" accent="slate" />
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1.35fr_0.9fr]">
              <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-2xl font-semibold tracking-tight">Driver Analysis</h3>
                <p className="mt-1 text-sm text-slate-600">
                  These are the structural constraints limiting your ability to scale predictably.
                </p>

                <div className="mt-5 grid gap-4 md:grid-cols-3">
                  {result.drivers.map((driver) => (
                    <div key={driver.label} className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-start justify-between gap-2">
                        <p className="max-w-[160px] text-sm font-semibold leading-5 text-slate-900">{driver.label}</p>
                        <span className={cn("rounded-full px-2.5 py-1 text-[11px] font-semibold", severityChip(driver.severity))}>
                          {driver.severity}
                        </span>
                      </div>
                      <p className="mt-3 text-4xl font-semibold tracking-tight">{driver.value}%</p>
                      <p className="mt-2 text-xs font-medium uppercase tracking-wide text-slate-500">{driver.benchmark}</p>
                      <p className="mt-3 text-sm leading-6 text-slate-600">{driver.explanation}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-2xl font-semibold tracking-tight">Architecture Breakdown</h3>

                <div className="mt-4 h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} />
                      <Radar name="Score" dataKey="score" stroke="#0f172a" fill="#0f172a" fillOpacity={0.15} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>

                <div className="mt-4 space-y-3">
                  {result.pillarScores.map((pillar) => (
                    <div key={pillar.name}>
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span className="font-medium text-slate-700">{pillar.name}</span>
                        <span className="font-semibold text-slate-900">{pillar.score}</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                        <div className={cn("h-full rounded-full", scorePillColor(pillar.score))} style={{ width: `${pillar.score}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
              <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-2xl font-semibold tracking-tight">Structural Interpretation</h3>
                <div className="mt-4 space-y-4 text-sm leading-7 text-slate-700">
                  <p>{result.summary}</p>
                  <p>{result.urgency}</p>
                  <p>Most teams attempt to fix this with more pipeline, more hiring, or more founder intervention. The issue is structural, not effort-driven.</p>
                </div>

                <div className="mt-5 rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-slate-700" />
                    <p className="text-sm font-semibold text-slate-900">Recommended next step</p>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-700">{result.recommendedNextStep}</p>

                  <div className="mt-4 flex flex-wrap gap-3">
                    <a
                      href={bookingUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white"
                    >
                      Get My Full Revenue Diagnostic
                      <ArrowRight className="h-4 w-4" />
                    </a>
                    <button
                      onClick={handleCopyTalkTrack}
                      className="rounded-full border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700"
                    >
                      Copy Live Demo Script
                    </button>
                  </div>
                </div>

                <div className="mt-5 rounded-[24px] border border-slate-200 bg-white p-4">
                  <p className="text-sm font-semibold text-slate-900">Live demo talk track</p>
                  <p className="mt-3 text-sm leading-7 text-slate-700">{result.liveDemoScript}</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                  <h3 className="text-2xl font-semibold tracking-tight">Benchmark View</h3>

                  <div className="mt-4 h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={benchmarkBars} layout="vertical" margin={{ top: 5, right: 18, left: 18, bottom: 5 }}>
                        <XAxis type="number" domain={[0, 100]} hide />
                        <YAxis type="category" dataKey="label" width={90} tick={{ fontSize: 12 }} />
                        <Tooltip />
                        <Bar dataKey="current" fill="#0f172a" radius={[8, 8, 8, 8]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                  <h3 className="text-2xl font-semibold tracking-tight">Top Risks</h3>
                  <div className="mt-4 space-y-3">
                    {result.topRisks.map((risk) => (
                      <div key={risk} className="rounded-[20px] border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700">
                        {risk}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

function MetricCard({ title, value, subtitle, accent, icon }) {
  const accents = {
    rose: "border-rose-200 bg-rose-50/50",
    amber: "border-amber-200 bg-amber-50/50",
    yellow: "border-yellow-200 bg-yellow-50/50",
    slate: "border-slate-200 bg-slate-50",
  };

  return (
    <div className={cn("rounded-[24px] border p-4", accents[accent])}>
      <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
        {icon}
        {title}
      </div>
      <div className="mt-4 text-4xl font-semibold tracking-tight">{value}</div>
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
      <div className="flex items-center rounded-2xl border border-slate-300 bg-white px-3 py-3">
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
