export async function POST(req) {
  const body = await req.json();

  const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
  const BASE_ID = process.env.AIRTABLE_BASE_ID;
  const TABLE = process.env.AIRTABLE_TABLE_NAME;

  const response = await fetch(
    `https://api.airtable.com/v0/${BASE_ID}/${TABLE}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${AIRTABLE_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        records: [
          {
            fields: body,
          },
        ],
      }),
    }
  );

  const data = await response.json();

  return Response.json(data);
}
