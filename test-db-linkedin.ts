import { db } from "./src/db/index";
import { mandateCandidates, flCandidates } from "./src/db/schema";
import { eq } from "drizzle-orm";

async function run() {
    const mcs = await db.select().from(mandateCandidates);
    console.log(`Found ${mcs.length} mandate candidates.`);
    
    for (const mc of mcs) {
        const fl = await db.select().from(flCandidates).where(eq(flCandidates.id, mc.externalId));
        if (fl.length > 0) {
            console.log(`MC: ${mc.name} (ext: ${mc.externalId}) -> FL LinkedIn: ${fl[0].linkedin || 'NULL'}`);
        } else {
            console.log(`MC: ${mc.name} (ext: ${mc.externalId}) -> NO FL CANDIDATE FOUND!`);
        }
    }
}
run();
