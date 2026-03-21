export function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

export function round(value) {
  return Math.round(value);
}

export function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function getQuestions() {
  return [
    {
      id: "top3AccountsPct",
      label: "How much of revenue sits in your top 3 clients?",
      helper:
        "Once this climbs, one renewal, budget cut, or scope change can materially destabilize the year.",
    },
    {
      id: "founderInfluencedRevenuePct",
      label: "How much revenue still needs founder intervention to close or protect?",
      helper:
        "If the founder is still the closer of last resort, scale is not transferable yet.",
    },
    {
      id: "forecastAccuracyPct",
      label: "How accurate is your current forecast?",
      helper:
        "A strong pipeline with weak forecast accuracy is usually a governance problem, not a demand problem.",
    },
    {
      id: "avgGrossMarginPct",
      label: "What gross margin are you actually holding today?",
      helper:
        "Growth that adds headcount faster than margin usually masks structural leakage.",
    },
    {
      id: "targetMarginPct",
      label: "What margin should this business be capable of holding?",
      helper:
        "The gap between current and target margin is where value is leaking today.",
    },
  ];
}

export function calculateAssessment(inputs) {
  const forecastVolatilityPct = clamp(100 - inputs.forecastAccuracyPct);
  const managerCoverageRatio =
    inputs.sellersCount > 0 ? inputs.managersCount / inputs.sellersCount : 0;
  const managerCoverageScore = clamp(managerCoverageRatio * 240);
  const marginGapPct = Math.max(inputs.targetMarginPct - inputs.avgGrossMarginPct, 0);

  const marginHealthScore = clamp(
    100 - marginGapPct * 5 - Math.max(0, 60 - inputs.avgGrossMarginPct) * 0.75
  );

  const productionScore = clamp(
    inputs.forecastAccuracyPct * 0.55 +
      (100 - inputs.top3AccountsPct) * 0.2 +
      marginHealthScore * 0.1 +
      managerCoverageScore * 0.15
  );

  const governanceScore = clamp(
    inputs.forecastAccuracyPct * 0.45 +
      (100 - inputs.founderInfluencedRevenuePct) * 0.35 +
      managerCoverageScore * 0.2
  );

  const resilienceScore = clamp(
    (100 - inputs.top3AccountsPct) * 0.65 +
      (100 - inputs.founderInfluencedRevenuePct) * 0.2 +
      inputs.forecastAccuracyPct * 0.15
  );

  const scalabilityScore = clamp(
    marginHealthScore * 0.45 +
      (100 - inputs.founderInfluencedRevenuePct) * 0.25 +
      managerCoverageScore * 0.15 +
      (100 - inputs.top3AccountsPct) * 0.15
  );

  const overallScore = round(
    productionScore * 0.2 +
      governanceScore * 0.3 +
      resilienceScore * 0.3 +
      scalabilityScore * 0.2
  );

  const concentratedRevenueBase = inputs.annualRevenue * (inputs.top3AccountsPct / 100);
  const exposureMultiplier = clamp(
    0.72 + inputs.founderInfluencedRevenuePct / 500 + forecastVolatilityPct / 250,
    0.55,
    1.15
  );

  const revenueAtRisk = Math.round(concentratedRevenueBase * exposureMultiplier);
  const marginLeakage = Math.round(inputs.annualRevenue * (marginGapPct / 100));

  const evCompressionLow = Math.round(marginLeakage * 2 + revenueAtRisk * 0.2);
  const evCompressionHigh = Math.round(marginLeakage * 3 + revenueAtRisk * 0.6);
  const predictabilityScore = overallScore;

  const systemsAxis = round((governanceScore + scalabilityScore) / 2);
  const predictabilityAxis = round(
    (inputs.forecastAccuracyPct + (100 - inputs.top3AccountsPct)) / 2
  );

  let profileType;
  if (systemsAxis < 55 && predictabilityAxis < 55) {
    profileType = "Founder Dependence";
  } else if (systemsAxis < 55 && predictabilityAxis >= 55) {
    profileType = "Founder-Anchored Stability";
  } else if (systemsAxis >= 55 && predictabilityAxis < 55) {
    profileType = "Institutional Theater";
  } else {
    profileType = "Institutional Scale";
  }

  let riskBand;
  if (overallScore >= 80) riskBand = "Low Structural Risk";
  else if (overallScore >= 65) riskBand = "Moderate Structural Risk";
  else riskBand = "High Structural Risk";

  const concentrationSeverity =
    inputs.top3AccountsPct >= 35 ? "High" : inputs.top3AccountsPct >= 25 ? "Moderate" : "Low";

  const founderSeverity =
    inputs.founderInfluencedRevenuePct >= 40
      ? "High"
      : inputs.founderInfluencedRevenuePct >= 25
        ? "Moderate"
        : "Low";

  const forecastSeverity =
    forecastVolatilityPct >= 25 ? "High" : forecastVolatilityPct >= 15 ? "Moderate" : "Low";

  const drivers = [
    {
      label: "Revenue Concentration Risk",
      value: round(inputs.top3AccountsPct),
      benchmark: "Target: 20–30%",
      severity: concentrationSeverity,
      explanation:
        concentrationSeverity === "High"
          ? "A meaningful share of revenue is tied to a narrow client base. One renewal, budget cut, or scope change could materially move the year."
          : concentrationSeverity === "Moderate"
            ? "Concentration is manageable, but only if diversification is being built intentionally."
            : "Client mix is diversified enough that concentration is not currently the main structural constraint.",
    },
    {
      label: "Founder Dependency Risk",
      value: round(inputs.founderInfluencedRevenuePct),
      benchmark: "Target: <25%",
      severity: founderSeverity,
      explanation:
        founderSeverity === "High"
          ? "Critical revenue still appears founder-shaped. That limits transferability, management depth, and the ability to scale calmly."
          : founderSeverity === "Moderate"
            ? "Founder involvement is still meaningful, but there is room to move ownership down into the manager layer."
            : "Founder involvement is low enough that revenue ownership can scale through the system, not heroic intervention.",
    },
    {
      label: "Forecast Instability",
      value: round(forecastVolatilityPct),
      benchmark: "Target: <15%",
      severity: forecastSeverity,
      explanation:
        forecastSeverity === "High"
          ? "Current forecasting suggests visibility exists, but control and manager-level ownership may still be inconsistent."
          : forecastSeverity === "Moderate"
            ? "Forecasting is usable, but likely relies too much on rep narrative and not enough on governance."
            : "Forecast reliability appears strong enough that planning should be driven by confidence, not debate.",
    },
  ];

  const pillarScores = [
    { name: "Revenue Production", score: round(productionScore) },
    { name: "Revenue Governance", score: round(governanceScore) },
    { name: "Revenue Resilience", score: round(resilienceScore) },
    { name: "Revenue Scalability", score: round(scalabilityScore) },
  ];

  const topRisks = [
    `${round(inputs.top3AccountsPct)}% of revenue concentrated in top 3 clients`,
    `Founder still influences ${round(inputs.founderInfluencedRevenuePct)}% of revenue`,
    `Forecast accuracy at ${round(inputs.forecastAccuracyPct)}% implies ${round(
      forecastVolatilityPct
    )}% instability`,
  ];

  const summary =
    overallScore >= 80
      ? "Your revenue system looks materially more durable than most founder-led agencies at this stage. The focus now is protecting discipline as complexity grows."
      : overallScore >= 65
        ? "Your revenue system has meaningful strengths, but fragility is beginning to emerge underneath growth. Without structural correction, the next stage of scale will feel harder than it should."
        : "Your current revenue system is showing clear signs of structural fragility. Growth may still be happening, but concentration, founder dependency, and forecast volatility are compounding risk underneath it.";

  const urgency =
    overallScore >= 80
      ? "This is worth tightening before growth compounds avoidable leakage."
      : overallScore >= 65
        ? "This is the point where most teams try to fix the issue with more pipeline or hiring. The more durable move is structural correction."
        : "At your next stage of growth, this typically results in increasing forecast inaccuracy, margin compression, and more founder involvement in closing revenue.";

  const recommendedNextStep =
    overallScore >= 80
      ? "Validate the few remaining pressure points, lock in manager accountability, and protect the margin profile before adding more complexity."
      : overallScore >= 65
        ? "Validate exactly where concentration, governance, and scalability are starting to drift, then prioritize the first 90-day correction sequence."
        : "Run a full Revenue Architecture Diagnostic to pinpoint where this exposure is originating structurally across accounts, governance, and margin mechanics.";

  const liveDemoScript = [
    `Based on what you entered, ${inputs.companyName || "this agency"} is operating as ${profileType}.`,
    `The first thing I would call out is ${formatCurrency(
      revenueAtRisk
    )} in potentially unstable revenue, driven primarily by ${round(
      inputs.top3AccountsPct
    )}% concentration and ${round(inputs.founderInfluencedRevenuePct)}% founder-shaped revenue.`,
    `The second is ${formatCurrency(
      marginLeakage
    )} of annual margin leakage versus your target operating profile.`,
    `The pattern underneath this is not a growth problem. It is a structural one: the business is still relying on concentration, founder intervention, and forecast variability more than a durable revenue system should.`,
    `If we unpacked this in the full diagnostic, I would want to validate where the exposure is actually coming from across segmentation, manager accountability, coverage, and margin construction.`,
  ].join(" ");

  return {
    overallScore,
    riskBand,
    profileType,
    revenueAtRisk,
    marginLeakage,
    predictabilityScore,
    evCompressionLow,
    evCompressionHigh,
    drivers,
    pillarScores,
    summary,
    urgency,
    recommendedNextStep,
    topRisks,
    liveDemoScript,
  };
}

export function buildExportNarrative(inputs, result) {
  return [
    `${inputs.companyName} generated a ${result.overallScore}/100 Revenue Fragility Snapshot score and currently maps to ${result.profileType}.`,
    result.summary,
    `The model estimates ${formatCurrency(result.revenueAtRisk)} in potentially unstable revenue and ${formatCurrency(result.marginLeakage)} in annualized margin leakage.`,
    `Using the valuation framing from the full diagnostic, that often translates into approximately ${formatCurrency(
      result.evCompressionLow
    )} to ${formatCurrency(result.evCompressionHigh)} of compressed enterprise value if left uncorrected.`,
    `Top risks identified: ${result.topRisks.join("; ")}.`,
    `Recommended next step: ${result.recommendedNextStep}`,
  ].join(" ");
}
