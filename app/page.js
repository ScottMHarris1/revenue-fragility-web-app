"use client";

import { useMemo, useState } from "react";

function currency(n) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(n) ? n : 0);
}

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

function riskTone(riskPct) {
  if (riskPct > 0.25) return { label: "High Structural Risk", bg: "#FEF2F2", border: "#FECACA", text: "#B91C1C" };
  if (riskPct > 0.15) return { label: "Moderate Structural Risk", bg: "#FFFBEB", border: "#FDE68A", text: "#B45309" };
  return { label: "Stable", bg: "#ECFDF5", border: "#A7F3D0", text: "#047857" };
}

function Field({ label, value, setValue, prefix = "", suffix = "" }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <label style={{ fontSize: 13, color: "#475569", fontWeight: 600 }}>{label}</label>
      <div style={{ position: "relative" }}>
        {prefix && <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#64748B" }}>{prefix}</span>}
        <input
          type="number"
          value={value}
          onChange={(e) => setValue(Number(e.target.value || 0))}
          style={{
            width: "100%",
            height: 44,
            borderRadius: 14,
            border: "1px solid #CBD5E1",
            paddingLeft: prefix ? 28 : 12,
            paddingRight: suffix ? 28 : 12,
          }}
        />
        {suffix && <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: "#64748B" }}>{suffix}</span>}
      </div>
    </div>
  );
}

function TextField({ label, value, setValue, type = "text" }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <label style={{ fontSize: 13, color: "#475569", fontWeight: 600 }}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        style={{
          width: "100%",
          height: 44,
          borderRadius: 14,
          border: "1px solid #CBD5E1",
          padding: "0 12px",
        }}
      />
    </div>
  );
}

export default function Page() {
  const [companyName, setCompanyName] = useState("Example Agency");
  const [email, setEmail] = useState("");
  const [revenue, setRevenue] = useState(30000000);
  const [top3, setTop3] = useState(35);
  const [margin, setMargin] = useState(58);
  const [targetMargin, setTargetMargin] = useState(65);
  const [founder, setFounder] = useState(50);
  const [forecast, setForecast] = useState(70);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const metrics = useMemo(() => {
    const base = (top3 / 100) * 0.4;
    const founderMult = founder < 40 ? 1.2 : 1.5;
    const forecastMult = forecast > 80 ? 1.1 : 1.3;
    const riskPct = clamp(base * founderMult * forecastMult, 0, 0.95);

    return {
      riskPct,
      revenueAtRisk: revenue * riskPct,
      marginLeakage: revenue * ((targetMargin - margin) / 100),
      predictability: Math.round(100 - (top3 * 0.3 + founder * 0.3 + (100 - forecast) * 0.4)),
    };
  }, [revenue, top3, margin, targetMargin, founder, forecast]);

  const risk = riskTone(metrics.riskPct);

  async function submitLead(e) {
    e.preventDefault();
    setSubmitError("");
    setSubmitted(false);

    const payload = {
      "Company Name": companyName,
      Email: email,
      Revenue: revenue,
      "Top3 %": top3,
      "Margin %": margin,
      "Target Margin %": targetMargin,
      "Founder %": founder,
      "Forecast %": forecast,
      "Revenue at Risk": Math.round(metrics.revenueAtRisk),
      "Margin Leakage": Math.round(metrics.marginLeakage),
      "Predictability Score": metrics.predictability,
      "Risk Level": risk.label,
    };

    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const text = await res.text();

      if (!res.ok) throw new Error(text);

      setSubmitted(true);
    } catch (err) {
      setSubmitError(err.message || "Something went wrong.");
    }
  }

  return (
    <main style={{ padding: 40, fontFamily: "Arial", maxWidth: 900 }}>
      <h1>Revenue Fragility Assessment</h1>

      <form onSubmit={submitLead} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <TextField label="Company name" value={companyName} setValue={setCompanyName} />
        <TextField label="Work email" value={email} setValue={setEmail} type="email" />

        <Field label="Revenue" value={revenue} setValue={setRevenue} prefix="$" />
        <Field label="Top 3 %" value={top3} setValue={setTop3} suffix="%" />
        <Field label="Margin %" value={margin} setValue={setMargin} suffix="%" />
        <Field label="Target Margin %" value={targetMargin} setValue={setTargetMargin} suffix="%" />
        <Field label="Founder %" value={founder} setValue={setFounder} suffix="%" />
        <Field label="Forecast %" value={forecast} setValue={setForecast} suffix="%" />

        <button type="submit">Get My Assessment</button>

        {submitted && (
          <p style={{ color: "green" }}>
            Your assessment has been captured. We’ll use this to guide a deeper analysis if needed.
          </p>
        )}

        {submitError && <p style={{ color: "red" }}>{submitError}</p>}
      </form>

      <h3>Results</h3>
      <p>Revenue at Risk: {currency(metrics.revenueAtRisk)}</p>
      <p>Margin Leakage: {currency(metrics.marginLeakage)}</p>
      <p>Predictability Score: {metrics.predictability}</p>
    </main>
  );
}
