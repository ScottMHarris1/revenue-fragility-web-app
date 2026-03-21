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
            "Company Name": body.companyName || "",
            "Work Email": body.workEmail || "",
            "Annual Revenue": body.annualRevenue || 0,
            "Top 3 Accounts %": body.top3AccountsPct || 0,
            "Average Gross Margin %": body.avgGrossMarginPct || 0,
            "Target Margin %": body.targetMarginPct || 0,
            "Founder Influenced Revenue %": body.founderInfluencedRevenuePct || 0,
            "Forecast Accuracy %": body.forecastAccuracyPct || 0,
            "Seller Count": body.sellersCount || 0,
            "Manager Count": body.managersCount || 0,
            "Overall Score": body.overallScore || 0,
            "Risk Band": body.riskBand || "",
            "Profile Type": body.profileType || "",
            "Revenue At Risk": body.revenueAtRisk || 0,
            "Margin Leakage": body.marginLeakage || 0,
            "Predictability Score": body.predictabilityScore || 0,
            "EV Compression Low": body.evCompressionLow || 0,
            "EV Compression High": body.evCompressionHigh || 0,
            "Top Risks": Array.isArray(body.topRisks) ? body.topRisks.join(" | ") : "",
            "Recommended Next Step": body.recommendedNextStep || "",
            "Live Demo Script": body.liveDemoScript || "",
            "Summary": body.summary || "",
            "Source": body.source || "Revenue Fragility Snapshot",
            "UTM Source": body.utmSource || "",
            "Lead Status": "New Snapshot Lead",
            "Booked?": false,
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

    return NextResponse.json({
      ok: true,
      record: airtableJson.records?.[0] || null,
    });
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
