import { NextResponse } from "next/server";
import { ApifyClient } from "apify-client";

export async function POST(req: Request) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ error: "Missing LinkedIn URL" }, { status: 400 });
    }

    // Initialize the ApifyClient with API token
    // Using the user-provided token directly as requested
    const client = new ApifyClient({
      token: process.env.APIFY_API_TOKEN,
    });

    // Prepare Actor input
    const input = {
      startUrls: [{ url }]
    };

    // Run the Actor and wait for it to finish
    const run = await client.actor("AgfKk0sQQxkpQJ1Dt").call(input);

    // Fetch Actor results from the run's dataset
    const { items } = await client.dataset(run.defaultDatasetId).listItems();

    if (items && items.length > 0) {
      return NextResponse.json({ data: items[0] });
    } else {
      return NextResponse.json({ error: "No data found for this URL" }, { status: 404 });
    }

  } catch (error: any) {
    console.error("Apify Error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch from Apify" }, { status: 500 });
  }
}
