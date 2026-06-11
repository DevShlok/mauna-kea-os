import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    const token = process.env.APIFY_API_TOKEN;
    if (!token) {
        return NextResponse.json({ error: "APIFY_API_TOKEN environment variable is absolutely missing on the Vercel server." }, { status: 500 });
    }

    try {
        const { url } = await req.json();
        if (!url) return NextResponse.json({ error: "Missing url" }, { status: 400 });

        const startRes = await fetch(`https://api.apify.com/v2/acts/harvestapi~linkedin-profile-scraper/runs?token=${token}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ urls: [url] })
        });
        
        const startData = await startRes.json();
        
        if (!startRes.ok) {
            throw new Error(startData.error?.message || JSON.stringify(startData));
        }

        return NextResponse.json({ runId: startData.data.id });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
