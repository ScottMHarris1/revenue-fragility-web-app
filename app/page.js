"use client";
import {
  calculateAssessment,
  buildExportNarrative,
  formatCurrency,
  getQuestions,
} from "../lib/fragility";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const body = await req.json();

    const apiKey = process.env.AIRTABLE_API_KEY;
    const baseId = process.env.AIRTABLE_BASE_ID;
    const tableName = process.env.AIRTABLE_TABLE_NAME;

    if (!apiKey || !baseId || !tableName) {
      return NextResponse.json(
        { ok: false, error: "Missing Airtable environment variables." },
        { status: 500 }
      );
    }

    const airtableUrl = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableName)}`;

    const airtableBody = {
      records: [
        {
          fields: {
            "Company Name": body.companyName,
            "Work Email": body.workEmail,
            "Annual Revenue": body.annualRevenue,
            "Top 3 Accounts %": body.top3AccountsPct,
            "Average Gross Margin %": body.avgGrossMarginPct,
            "Target Margin %": body.targetMarginPct,
            "Founder Influenced Revenue %": body.founderInfluencedRevenuePct,
            "Forecast Accuracy %": body.forecastAccuracyPct,
            "Seller Count": body.sellersCount,
            "Manager Count": body.managersCount,
            "Overall Score": body.overallScore,
            "Risk Band": body.riskBand,
            "Profile Type": body.profileType,
            "Revenue At Risk": body.revenueAtRisk,
            "Margin Leakage": body.marginLeakage,
            "Predictability Score": body.predictabilityScore,
            "EV Compression Low": body.evCompressionLow,
            "EV Compression High": body.evCompressionHigh,
            "Top Risks": body.topRisks.join(" | "),
            "Recommended Next Step": body.recommendedNextStep,
            "Live Demo Script": body.liveDemoScript,
            Summary: body.summary,
            Source: body.source || "Revenue Fragility Snapshot",
            "Created At": new Date().toISOString(),
          },
        },
      ],
    };

    const airtableRes = await fetch(airtableUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(airtableBody),
      cache: "no-store",
    });

    const airtableJson = await airtableRes.json();

    if (!airtableRes.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: airtableJson?.error?.message || "Airtable write failed.",
          details: airtableJson,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, record: airtableJson.records?.[0] });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error?.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}
