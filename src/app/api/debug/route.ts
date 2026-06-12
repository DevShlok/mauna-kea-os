import { db } from "@/db";
import { mandateCandidates, candidates } from "@/db/schema";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const mcs = await db.select().from(mandateCandidates);
    const results = [];
    
    for (const mc of mcs) {
      const [fl] = await db.select().from(candidates).where(eq(candidates.id, mc.externalId));
      results.push({
        name: mc.name,
        mandateCandidateId: mc.id,
        externalId: mc.externalId,
        flCandidateId: fl?.id,
        linkedInInFloatDb: fl?.linkedin || null
      });
    }

    return NextResponse.json(results);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
