"use client";

import { useState } from "react";

export default function Page() {
  const [revenue, setRevenue] = useState(30000000);
  const [top3, setTop3] = useState(35);
  const [margin, setMargin] = useState(58);
  const [targetMargin, setTargetMargin] = useState(65);
  const [founder, setFounder] = useState(50);
  const [forecast, setForecast] = useState(70);

  // calculations
  const baseExposure = (top3 / 100) * 0.4;

  const founderMult =
    founder < 20 ? 1 : founder < 40 ? 1.2 : founder < 60 ? 1.5 : 1.8;

  const forecastMult =
    forecast > 90 ? 1 : forecast > 80 ? 1.1 : forecast > 70 ? 1.3 : 1.5;

  const riskPct = baseExposure * founderMult * forecastMult;
  const revenueAtRisk = revenue * riskPct;
  const marginLeakage = revenue * ((targetMargin - margin) / 100);

  const predictability =
    100 -
    (top3 * 0.3 + founder * 0.3 + (100 - forecast) * 0.4);

  return (
    <main style={{ padding: 40, fontFamily: "Arial", maxWidth: 900 }}>
      <h1>Revenue Fragility Calculator</h1>

      <h3>Inputs</h3>

      <input type="number" value={revenue} onChange={(e) => setRevenue(Number(e.target.value))} /> Revenue<br />
      <input type="number" value={top3} onChange={(e) => setTop3(Number(e.target.value))} /> Top 3 %<br />
      <input type="number" value={margin} onChange={(e) => setMargin(Number(e.target.value))} /> Margin %<br />
      <input type="number" value={targetMargin} onChange={(e) => setTargetMargin(Number(e.target.value))} /> Target Margin %<br />
      <input type="number" value={founder} onChange={(e) => setFounder(Number(e.target.value))} /> Founder %<br />
      <input type="number" value={forecast} onChange={(e) => setForecast(Number(e.target.value))} /> Forecast %<br />

      <h3>Outputs</h3>

      <p>Revenue at Risk: ${Math.round(revenueAtRisk).toLocaleString()}</p>
      <p>Margin Leakage: ${Math.round(marginLeakage).toLocaleString()}</p>
      <p>Predictability Score: {Math.round(predictability)}</p>
    </main>
  );
}
