"use client";

import { useMemo, useState } from "react";

function currency(n) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n || 0);
}

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

export default function Page() {
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [revenue, setRevenue] = useState(30000000);
  const [top3, setTop3] = useState(35);
  const [margin, setMargin] = useState(58);
  const [targetMargin, setTargetMargin] = useState(65);
  const [founder, setFounder] = useState(50);
  const [forecast, setForecast] = useState(70);
  const [submitted, setSubmitted] = useState(false);

  const metrics = useMemo(() => {
    const baseExposure = (top3 / 100) * 0.4;
    const founderMult =
      founder < 20 ? 1 : founder < 40 ? 1.2 : founder < 60 ? 1.5 : 1.8;
    const forecastMult =
      forecast > 90 ? 1 : forecast > 80 ? 1.1 : forecast > 70 ? 1.3 : 1.5;

    const riskPct = clamp(baseExposure * founderMult * forecastMult, 0, 1);
    const revenueAtRisk = revenue * riskPct;
    const marginLeakage = revenue * ((targetMargin - margin) / 100);
    const predictability = Math.round(
      100 - (top3 * 0.3 + founder * 0.3 + (100 - forecast) * 0.4)
    );

    return { riskPct, revenueAtRisk, marginLeakage, predictability };
  }, [revenue, top3, margin, targetMargin, founder, forecast]);

  async function submitLead(e) {
    e.preventDefault();

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
      "Risk Level":
        metrics.riskPct > 0.25
          ? "High"
          : metrics.riskPct > 0.15
          ? "Moderate"
          : "Low",
    };

    try {
      await fetch("/api/lead", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      setSubmitted(true);
    } catch (err) {
      console.error(err);
      alert("Error submitting lead");
    }
  }

  return (
    <main style={{ padding: 40, fontFamily: "Arial", maxWidth: 900 }}>
      <h1>Revenue Fragility Calculator</h1>

      <h3>Lead Info</h3>
      <input
        placeholder="Company Name"
        value={companyName}
        onChange={(e) => setCompanyName(e.target.value)}
      />
      <br />
      <input
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <br />

      <h3>Inputs</h3>

      <input
        type="number"
        value={revenue}
        onChange={(e) => setRevenue(Number(e.target.value))}
      />{" "}
      Revenue
      <br />

      <input
        type="number"
        value={top3}
        onChange={(e) => setTop3(Number(e.target.value))}
      />{" "}
      Top 3 %
      <br />

      <input
        type="number"
        value={margin}
        onChange={(e) => setMargin(Number(e.target.value))}
      />{" "}
      Margin %
      <br />

      <input
        type="number"
        value={targetMargin}
        onChange={(e) => setTargetMargin(Number(e.target.value))}
      />{" "}
      Target Margin %
      <br />

      <input
        type="number"
        value={founder}
        onChange={(e) => setFounder(Number(e.target.value))}
      />{" "}
      Founder %
      <br />

      <input
        type="number"
        value={forecast}
        onChange={(e) => setForecast(Number(e.target.value))}
      />{" "}
      Forecast %
      <br />

      <h3>Outputs</h3>

      <p>Revenue at Risk: {currency(metrics.revenueAtRisk)}</p>
      <p>Margin Leakage: {currency(metrics.marginLeakage)}</p>
      <p>Predictability Score: {metrics.predictability}</p>

      <br />

      <button onClick={submitLead}>Submit + Capture Lead</button>

      {submitted && <p style={{ color: "green" }}>Lead captured ✅</p>}
    </main>
  );
}
