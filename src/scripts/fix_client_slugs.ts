import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { db } from "../db";
import { clients } from "../db/schema";
import { eq } from "drizzle-orm";
import { slugify } from "../lib/slug";

async function run() {
  const allClients = await db.select().from(clients);
  console.log("Processing clients count:", allClients.length);

  for (const c of allClients) {
    let baseSlug = slugify(c.name || "company");
    if (!baseSlug) baseSlug = `client-${c.id.toLowerCase()}`;

    let slug = baseSlug;
    let counter = 1;
    while (true) {
      const existing = await db
        .select({ id: clients.id })
        .from(clients)
        .where(eq(clients.slug, slug));
      if (existing.length === 0 || existing[0].id === c.id) break;
      slug = `${baseSlug}-${counter++}`;
    }

    await db.update(clients).set({ slug }).where(eq(clients.id, c.id));
    console.log(`Updated client '${c.name}' -> slug: '${slug}'`);
  }

  const [nykaa] = await db.select().from(clients).where(eq(clients.id, "CLI-1784177492520-52"));
  console.log("Nykaa updated slug:", nykaa?.name, "->", nykaa?.slug);
  process.exit(0);
}

run();
