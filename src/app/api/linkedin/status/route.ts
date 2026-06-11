import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    const token = process.env.APIFY_API_TOKEN;
    if (!token) {
        return NextResponse.json({ error: "APIFY_API_TOKEN environment variable is absolutely missing on the Vercel server." }, { status: 500 });
    }

    try {
        const { searchParams } = new URL(req.url);
        const runId = searchParams.get('runId');
        if (!runId) return NextResponse.json({ error: "Missing runId" }, { status: 400 });

        const statusRes = await fetch(`https://api.apify.com/v2/actor-runs/${runId}?token=${token}`);
        const statusData = await statusRes.json();
        
        if (!statusRes.ok) {
            throw new Error(statusData.error?.message || JSON.stringify(statusData));
        }

        const run = statusData.data;

        if (run.status === 'SUCCEEDED') {
            const datasetRes = await fetch(`https://api.apify.com/v2/datasets/${run.defaultDatasetId}/items?token=${token}`);
            const items = await datasetRes.json();
            return NextResponse.json({ status: 'SUCCEEDED', data: items[0] });
        }
        
        if (run.status === 'FAILED' || run.status === 'ABORTED') {
            return NextResponse.json({ status: 'FAILED' });
        }

        return NextResponse.json({ status: 'RUNNING' });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
