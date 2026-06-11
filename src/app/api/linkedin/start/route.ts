import { ApifyClient } from 'apify-client';
import { NextResponse } from 'next/server';

const client = new ApifyClient({
    token: process.env.APIFY_API_TOKEN,
});

export async function POST(req: Request) {
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
