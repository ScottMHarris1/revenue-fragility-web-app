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
  if (riskPct > 0.25) {
    return {
      label: "High Structural Risk",
      bg: "#FEF2F2",
      border: "#FECACA",
      text: "#B91C1C",
    };
  }
  if (riskPct > 0.15) {
    return {
      label: "Moderate Structural Risk",
      bg: "#FFFBEB",
      border: "#FDE68A",
      text: "#B45309",
    };
  }
  return {
    label: "Stable",
    bg: "#ECFDF5",
    border: "#A7F3D0",
    text: "#047857",
  };
}

function driverFlag(type, value) {
  if (type === "concentration") return value >= 35 ? "High" : value >= 25 ? "Moderate" : "Low";
  if (type === "founder") return value >= 40 ? "High" : value >= 25 ? "Moderate" : "Low";
  if (type === "forecast") return value < 75 ? "High" : value < 85 ? "Moderate" : "Low";
  return "Low";
}

function flagTone(flag) {
  if (flag === "High") return { bg: "#FEF2F2", border: "#FECACA", text: "#B91C1C" };
  if (flag === "Moderate") return { bg: "#FFFBEB", border: "#FDE68A", text: "#B45309" };
  return { bg: "#ECFDF5", border: "#A7F3D0", text: "#047857" };
}

function Field({ label, value, setValue, prefix = "", suffix = "" }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <label style={{ fontSize: 13, color: "#475569", fontWeight: 600 }}>{label}</label>
      <div style={{ position: "relative" }}>
        {prefix ? (
          <span
            style={{
              position: "absolute",
              left: 12,
              top: "50%",
              transform: "translateY(-50%)",
              color: "#64748B",
              fontSize: 14,
            }}
          >
            {prefix}
          </span>
        ) : null}
        <input
          type="number"
          value={value}
          onChange={(e) => setValue(Number(e.target.value || 0))}
          style={{
            width: "100%",
            boxSizing: "border-box",
            height: 44,
            borderRadius: 14,
            border: "1px solid #CBD5E1",
            background: "white",
            paddingLeft: prefix ? 28 : 12,
            paddingRight: suffix ? 30 : 12,
            fontSize: 14,
            outline: "none",
          }}
        />
        {suffix ? (
          <span
            style={{
              position: "absolute",
              right: 12,
              top: "50%",
              transform: "translateY(-50%)",
              color: "#64748B",
              fontSize: 14,
            }}
          >
            {suffix}
          </span>
        ) : null}
      </div>
    </div>
  );
}

function TextField({ label, value, setValue, placeholder = "", type = "text" }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <label style={{ fontSize: 13, color: "#475569", fontWeight: 600 }}>{label}</label>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => setValue(e.target.value)}
        style={{
          width: "100%",
          boxSizing: "border-box",
          height: 44,
          borderRadius: 14,
          border: "1px solid #CBD5E1",
          background: "white",
          padding: "0 12px",
          fontSize: 14,
          outline: "none",
        }}
      />
    </div>
  );
}

function MetricCard({ title, value, subtext, tone }) {
  return (
    <div
      style={{
        border: `1px solid ${tone.border}`,
        background: `linear-gradient(180deg, ${tone.bg} 0%, #FFFFFF 100%)`,
        borderRadius: 24,
        padding: 20,
        boxShadow: "0 1px 2px rgba(15, 23, 42, 0.04)",
      }}
    >
      <div style={{ fontSize: 13, fontWeight: 600, color: "#64748B", marginBottom: 12 }}>{title}</div>
      <div style={{ fontSize: 34, lineHeight: 1.05, fontWeight: 700, color: "#0F172A", letterSpacing: -0.8 }}>
        {value}
      </div>
      <div style={{ marginTop: 10, fontSize: 13, lineHeight: 1.5, color: "#64748B" }}>{subtext}</div>
    </div>
  );
}

function DriverCard({ title, value, flag, insight }) {
  const tone = flagTone(flag);
  return (
    <div style={{ border: "1px solid #E2E8F0", borderRadius: 24, background: "#F8FAFC", padding: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#64748B" }}>{title}</div>
          <div style={{ marginTop: 10, fontSize: 28, fontWeight: 700, color: "#0F172A" }}>{value}</div>
        </div>
        <div
          style={{
            border: `1px solid ${tone.border}`,
            background: tone.bg,
            color: tone.text,
            borderRadius: 999,
            padding: "6px 10px",
            fontSize: 12,
            fontWeight: 700,
            whiteSpace: "nowrap",
          }}
        >
          {flag}
        </div>
      </div>
      <div style={{ marginTop: 14, fontSize: 13, lineHeight: 1.6, color: "#64748B" }}>{insight}</div>
    </div>
  );
}

function ProgressRow({ label, current, target, progress }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "baseline" }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#0F172A" }}>{label}</div>
          <div style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>Current: {current}</div>
        </div>
        <div style={{ fontSize: 12, color: "#64748B" }}>Target: {target}</div>
      </div>
      <div
        style={{
          height: 8,
          width: "100%",
          background: "#E2E8F0",
          borderRadius: 999,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${clamp(progress, 6, 100)}%`,
            background: "#0F172A",
            borderRadius: 999,
          }}
        />
      </div>
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
  const [sellers, setSellers] = useState(12);
  const [managers, setManagers] = useState(3);
  const [forecast, setForecast] = useState(70);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const metrics = useMemo(() => {
    const baseExposure = (top3 / 100) * 0.4;
    const founderMult = founder < 20 ? 1 : founder < 40 ? 1.2 : founder < 60 ? 1.5 : 1.8;
    const forecastMult = forecast > 90 ? 1 : forecast > 80 ? 1.1 : forecast > 70 ? 1.3 : 1.5;
    const riskPct = clamp(baseExposure * founderMult * forecastMult, 0, 0.95);
    const revenueAtRisk = revenue * riskPct;
    const marginLeakage = Math.max(0, revenue * ((targetMargin - margin) / 100));
    const predictability = Math.round(
      clamp(100 - (top3 * 0.3 + founder * 0.3 + (100 - forecast) * 0.4), 0, 100)
    );
    return { riskPct, revenueAtRisk, marginLeakage, predictability };
  }, [revenue, top3, margin, targetMargin, founder, forecast]);

  const risk = riskTone(metrics.riskPct);
  const concentrationFlag = driverFlag("concentration", top3);
  const founderFlag = driverFlag("founder", founder);
  const forecastFlag = driverFlag("forecast", forecast);

  async function submitLead(e) {
    e.preventDefault();
    setSubmitError("");
    setSubmitted(false);

    const payload = {
      "Company Name": companyName,
      Email: email,
      "Revenue": revenue,
      "Top3 %": top3,
      "Margin %": margin,
      "Target Margin %": targetMargin,
      "Founder %": founder,
      "Forecast %": forecast,
      "Revenue at Risk": Math.round(metrics.revenueAtRisk),
      "Margin Leakage": Math.round(metrics.marginLeakage),
      "Predictability Score": metrics.predictability,
      "Risk Level": risk.label,
      "Sellers": sellers,
      "Managers": managers,
    };

    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const text = await res.text();

      if (!res.ok) {
        throw new Error(text || "Submission failed");
      }

      setSubmitted(true);
    } catch (err) {
      console.error(err);
      setSubmitError(err.message || "Lead save failed");
    }
  }

  function exportSummary() {
    const lines = [
      "Revenue Fragility Assessment",
      `Company: ${companyName}`,
      `Email: ${email || "Not provided"}`,
      `Annual Revenue: ${currency(revenue)}`,
      `Top 3 Accounts: ${top3}%`,
      `Avg Gross Margin: ${margin}%`,
      `Target Margin: ${targetMargin}%`,
      `Founder Influenced Revenue: ${founder}%`,
      `Forecast Accuracy: ${forecast}%`,
      `Revenue at Risk: ${currency(metrics.revenueAtRisk)}`,
      `Risk Percent: ${(metrics.riskPct * 100).toFixed(1)}%`,
      `Margin Leakage: ${currency(metrics.marginLeakage)}`,
      `Predictability Score: ${metrics.predictability}/100`,
      `Risk Level: ${risk.label}`,
    ].join("\n");

    const blob = new Blob([lines], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${(companyName || "revenue-fragility").replace(/\s+/g, "-").toLowerCase()}-assessment.txt`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#F8FAFC",
        padding: 24,
        fontFamily: "Arial, sans-serif",
        color: "#0F172A",
      }}
    >
      <div style={{ maxWidth: 1220, margin: "0 auto" }}>
        <div
          style={{
            background: "white",
            border: "1px solid #E2E8F0",
            borderRadius: 28,
            padding: 28,
            boxShadow: "0 1px 2px rgba(15, 23, 42, 0.04)",
            display: "flex",
            justifyContent: "space-between",
            gap: 20,
            alignItems: "flex-end",
            flexWrap: "wrap",
          }}
        >
          <div>
            <div
              style={{
                display: "inline-block",
                fontSize: 12,
                fontWeight: 700,
                color: "#475569",
                background: "#F8FAFC",
                border: "1px solid #E2E8F0",
                borderRadius: 999,
                padding: "7px 12px",
                marginBottom: 14,
              }}
            >
              Revenue Architecture
            </div>
            <h1 style={{ margin: 0, fontSize: 40, lineHeight: 1.05, letterSpacing: -1.2 }}>
              Revenue Fragility Assessment
            </h1>
            <p style={{ marginTop: 12, maxWidth: 760, color: "#64748B", fontSize: 15, lineHeight: 1.7 }}>
              Quantify structural revenue exposure, margin leakage, and predictability risk — then convert that insight into a validation session.
            </p>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button
              onClick={() => {
                setCompanyName("Example Agency");
                setEmail("");
                setRevenue(30000000);
                setTop3(35);
                setMargin(58);
                setTargetMargin(65);
                setFounder(50);
                setSellers(12);
                setManagers(3);
                setForecast(70);
                setSubmitted(false);
                setSubmitError("");
              }}
              style={{
                height: 42,
                borderRadius: 14,
                border: "1px solid #CBD5E1",
                background: "white",
                padding: "0 16px",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              Reset
            </button>
            <button
              onClick={exportSummary}
              style={{
                height: 42,
                borderRadius: 14,
                border: "1px solid #0F172A",
                background: "#0F172A",
                color: "white",
                padding: "0 16px",
                cursor: "pointer",
                fontWeight: 700,
              }}
            >
              Export Summary
            </button>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(320px, 400px) minmax(0, 1fr)",
            gap: 24,
            marginTop: 24,
          }}
        >
          <div
            style={{
              background: "white",
              border: "1px solid #E2E8F0",
              borderRadius: 28,
              padding: 24,
              boxShadow: "0 1px 2px rgba(15, 23, 42, 0.04)",
            }}
          >
            <div style={{ fontSize: 24, fontWeight: 700, marginBottom: 6 }}>Assessment Inputs</div>
            <div style={{ fontSize: 14, lineHeight: 1.6, color: "#64748B", marginBottom: 20 }}>
              Capture the commercial signals that drive structural exposure.
            </div>

            <form onSubmit={submitLead} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <TextField label="Company name" value={companyName} setValue={setCompanyName} />
              <TextField
                label="Lead capture email"
                value={email}
                setValue={setEmail}
                placeholder="name@company.com"
                type="email"
              />

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <Field label="Annual revenue" value={revenue} setValue={setRevenue} prefix="$" />
                <Field label="Top 3 accounts" value={top3} setValue={setTop3} suffix="%" />
                <Field label="Avg gross margin" value={margin} setValue={setMargin} suffix="%" />
                <Field label="Target margin" value={targetMargin} setValue={setTargetMargin} suffix="%" />
                <Field label="Founder influenced revenue" value={founder} setValue={setFounder} suffix="%" />
                <Field label="Forecast accuracy" value={forecast} setValue={setForecast} suffix="%" />
                <Field label="# of sellers" value={sellers} setValue={setSellers} />
                <Field label="# of managers" value={managers} setValue={setManagers} />
              </div>

              <button
                type="submit"
                style={{
                  marginTop: 6,
                  height: 46,
                  borderRadius: 16,
                  border: "1px solid #0F172A",
                  background: "#0F172A",
                  color: "white",
                  fontWeight: 700,
                  fontSize: 14,
                  cursor: "pointer",
                }}
              >
                Capture Lead
              </button>

              {submitted ? (
                <div
                  style={{
                    borderRadius: 16,
                    border: "1px solid #A7F3D0",
                    background: "#ECFDF5",
                    padding: 14,
                    fontSize: 13,
                    lineHeight: 1.6,
                    color: "#047857",
                  }}
                >
                  Lead captured successfully.
                </div>
              ) : null}

              {submitError ? (
                <div
                  style={{
                    borderRadius: 16,
                    border: "1px solid #FECACA",
                    background: "#FEF2F2",
                    padding: 14,
                    fontSize: 13,
                    lineHeight: 1.6,
                    color: "#B91C1C",
                    whiteSpace: "pre-wrap",
                    overflowWrap: "anywhere",
                  }}
                >
                  {submitError}
                </div>
              ) : null}
            </form>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div
              style={{
                background: "white",
                border: "1px solid #E2E8F0",
                borderRadius: 28,
                padding: 20,
                boxShadow: "0 1px 2px rgba(15, 23, 42, 0.04)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 16,
                flexWrap: "wrap",
              }}
            >
              <div>
                <div style={{ fontSize: 13, color: "#64748B", fontWeight: 600 }}>Assessment for</div>
                <div style={{ marginTop: 6, fontSize: 30, fontWeight: 700, letterSpacing: -0.8 }}>
                  {companyName || "Untitled Company"}
                </div>
              </div>
              <div
                style={{
                  border: `1px solid ${risk.border}`,
                  background: risk.bg,
                  color: risk.text,
                  borderRadius: 999,
                  padding: "8px 12px",
                  fontWeight: 700,
                  fontSize: 13,
                }}
              >
                {risk.label}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 16 }}>
              <MetricCard
                title="Revenue at Risk"
                value={currency(metrics.revenueAtRisk)}
                subtext={`${(metrics.riskPct * 100).toFixed(1)}% of total revenue exposed`}
                tone={risk}
              />
              <MetricCard
                title="Margin Leakage"
                value={currency(metrics.marginLeakage)}
                subtext="Annualized gap vs target operating profile"
                tone={{ bg: "#FFF7ED", border: "#FED7AA", text: "#C2410C" }}
              />
              <MetricCard
                title="Predictability Score"
                value={`${metrics.predictability}/100`}
                subtext="System-level ability to forecast and scale reliably"
                tone={
                  metrics.predictability < 50
                    ? { bg: "#FEF2F2", border: "#FECACA", text: "#B91C1C" }
                    : metrics.predictability < 70
                    ? { bg: "#FFFBEB", border: "#FDE68A", text: "#B45309" }
                    : { bg: "#ECFDF5", border: "#A7F3D0", text: "#047857" }
                }
              />
            </div>

            <div
              style={{
                background: "white",
                border: "1px solid #E2E8F0",
                borderRadius: 28,
                padding: 24,
                boxShadow: "0 1px 2px rgba(15, 23, 42, 0.04)",
              }}
            >
              <div style={{ fontSize: 24, fontWeight: 700, marginBottom: 6 }}>Driver Analysis</div>
              <div style={{ fontSize: 14, lineHeight: 1.6, color: "#64748B", marginBottom: 18 }}>
                Where structural exposure is being created.
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 16 }}>
                <DriverCard
                  title="Concentration Exposure"
                  value={`${top3}%`}
                  flag={concentrationFlag}
                  insight="Revenue concentration at this level is manageable only when ownership is distributed and expansion is systematic."
                />
                <DriverCard
                  title="Founder Dependency"
                  value={`${founder}%`}
                  flag={founderFlag}
                  insight="A meaningful share of revenue appears relationship-held, not fully system-held, which limits scalability and transferability."
                />
                <DriverCard
                  title="Forecast Volatility"
                  value={`${forecast}%`}
                  flag={forecastFlag}
                  insight="Current forecasting suggests visibility exists, but control and manager-level ownership may still be inconsistent."
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: 16 }}>
              <div
                style={{
                  background: "white",
                  border: "1px solid #E2E8F0",
                  borderRadius: 28,
                  padding: 24,
                  boxShadow: "0 1px 2px rgba(15, 23, 42, 0.04)",
                }}
              >
                <div style={{ fontSize: 24, fontWeight: 700, marginBottom: 6 }}>Structural Interpretation</div>
                <div style={{ fontSize: 14, lineHeight: 1.8, color: "#475569" }}>
                  <p style={{ marginTop: 0 }}>
                    This analysis indicates structural exposure driven by the interaction of revenue concentration,
                    founder-dependent ownership, and forecast variability.
                  </p>
                  <p>
                    As the business scales, this reduces predictability and introduces risk to both revenue stability and
                    margin integrity. The issue is less about visibility and more about whether the operating model
                    translates that visibility into manager-level control.
                  </p>
                </div>
                <div
                  style={{
                    marginTop: 14,
                    border: "1px solid #E2E8F0",
                    background: "#F8FAFC",
                    borderRadius: 20,
                    padding: 16,
                  }}
                >
                  <div style={{ fontWeight: 700, marginBottom: 6 }}>Recommended next step</div>
                  <div style={{ fontSize: 14, lineHeight: 1.7, color: "#475569" }}>
                    Validate where this exposure is originating structurally across account ownership, forecast
                    construction, and margin drivers, then determine whether the exposure is large enough to justify a
                    deeper diagnostic.
                  </div>
                </div>
              </div>

              <div
                style={{
                  background: "white",
                  border: "1px solid #E2E8F0",
                  borderRadius: 28,
                  padding: 24,
                  boxShadow: "0 1px 2px rgba(15, 23, 42, 0.04)",
                }}
              >
                <div style={{ fontSize: 24, fontWeight: 700, marginBottom: 6 }}>Benchmark View</div>
                <div style={{ fontSize: 14, lineHeight: 1.6, color: "#64748B", marginBottom: 18 }}>
                  Position against a stronger operating profile.
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                  <ProgressRow
                    label="Concentration"
                    current={`${top3}%`}
                    target="20–30%"
                    progress={100 - Math.max(0, top3 - 20) * 4}
                  />
                  <ProgressRow
                    label="Founder Dependency"
                    current={`${founder}%`}
                    target="<25%"
                    progress={100 - Math.max(0, founder - 15) * 2.5}
                  />
                  <ProgressRow
                    label="Forecast Accuracy"
                    current={`${forecast}%`}
                    target="85–95%"
                    progress={(forecast / 95) * 100}
                  />
                  <ProgressRow
                    label="Margin"
                    current={`${margin}%`}
                    target={`${targetMargin}%+`}
                    progress={(margin / Math.max(targetMargin, 1)) * 100}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 18, fontSize: 12, color: "#64748B", textAlign: "center" }}>
          Built as a scalable lead-capture and validation wedge for Revenue Architecture.
        </div>
      </div>
    </main>
  );
}
