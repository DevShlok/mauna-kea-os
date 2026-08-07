import { NextResponse } from "next/server";
import { ApifyClient } from "apify-client";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { validateBody } from "@/lib/api-guard";
import { z } from "zod";

// ─── Request schema ───────────────────────────────────────────────────────────

const requestSchema = z.object({
  /**
   * A public LinkedIn profile URL.
   * Must contain "linkedin.com/in/" to prevent accidental (or malicious)
   * Apify credit burn on non-LinkedIn URLs.
   */
  url: z
    .string({ required_error: "url is required" })
    .url("url must be a valid URL")
    .refine(
      (u) => u.includes("linkedin.com/in/"),
      "url must be a LinkedIn profile URL (e.g. https://linkedin.com/in/username)"
    ),
});

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  // Rate limit: 5 requests per minute per IP (Apify is a paid-per-run service)
  const rl = rateLimit(req, "apify-linkedin", { limit: 5, windowMs: 60_000 });
  if (!rl.success) return rateLimitResponse(rl.retryAfter);

  try {
    // Validate and strip unknown fields
    const parsed = validateBody(requestSchema, await req.json());
    if ("error" in parsed) return parsed.error;

    const { url } = parsed.data;

    if (!process.env.APIFY_API_TOKEN) {
      console.error("APIFY_API_TOKEN is not set");
      return NextResponse.json({ error: "LinkedIn scraping is not configured" }, { status: 503 });
    }

    const client = new ApifyClient({ token: process.env.APIFY_API_TOKEN });

    // Run the Actor and wait for it to finish
    const run = await client.actor("AgfKk0sQQxkpQJ1Dt").call({ startUrls: [{ url }] });

    // Fetch Actor results from the run's dataset
    const { items } = await client.dataset(run.defaultDatasetId).listItems();

    if (items && items.length > 0) {
      if (items[0].errorMessage) {
        return NextResponse.json({ error: items[0].errorMessage }, { status: 403 });
      }
      return NextResponse.json({ data: items[0] });
    } else {
      return NextResponse.json({ error: "No data found for this URL" }, { status: 404 });
    }
  } catch (error: any) {
    console.error("Apify Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch from Apify" },
      { status: 500 }
    );
  }
}
