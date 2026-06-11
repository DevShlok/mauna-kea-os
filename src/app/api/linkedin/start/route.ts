import { ApifyClient } from 'apify-client';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    if (!process.env.APIFY_API_TOKEN) {
        return NextResponse.json({ error: "APIFY_API_TOKEN environment variable is absolutely missing on the Vercel server. Vercel cannot see your token." }, { status: 500 });
    }

    const client = new ApifyClient({
        token: process.env.APIFY_API_TOKEN,
    });

    try {
        const { url } = await req.json();
        if (!url) return NextResponse.json({ error: "Missing url" }, { status: 400 });

        // Start the actor asynchronously
        const run = await client.actor('harvestapi/linkedin-profile-scraper').start({
            urls: [url]
        });

        return NextResponse.json({ runId: run.id });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
