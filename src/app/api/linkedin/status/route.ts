import { ApifyClient } from 'apify-client';
import { NextResponse } from 'next/server';

const client = new ApifyClient({
    token: process.env.APIFY_API_TOKEN,
});

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const runId = searchParams.get('runId');
        if (!runId) return NextResponse.json({ error: "Missing runId" }, { status: 400 });

        const run = await client.run(runId).get();
        if (!run) return NextResponse.json({ error: "Run not found" }, { status: 404 });

        if (run.status === 'SUCCEEDED') {
            const { items } = await client.dataset(run.defaultDatasetId).listItems();
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
