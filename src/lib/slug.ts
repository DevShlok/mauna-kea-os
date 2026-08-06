import { db } from "@/db";
import { candidates, clients } from "@/db/schema";
import { eq } from "drizzle-orm";

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export async function getOrCreateCandidateSlug(candId: string, candName?: string): Promise<string> {
  const [cand] = await db.select().from(candidates).where(eq(candidates.id, candId));
  if (cand?.slug) return cand.slug;

  const baseName = candName || cand?.name || "candidate";
  let baseSlug = slugify(baseName);
  if (!baseSlug) baseSlug = `cand-${candId.toLowerCase()}`;

  let slug = baseSlug;
  let counter = 1;
  while (true) {
    const existing = await db.select({ id: candidates.id }).from(candidates).where(eq(candidates.slug, slug));
    if (existing.length === 0 || existing[0].id === candId) break;
    slug = `${baseSlug}-${counter++}`;
  }

  if (cand) {
    await db.update(candidates).set({ slug }).where(eq(candidates.id, candId));
  }
  return slug;
}

export async function getOrCreateClientSlug(clientId: string, clientName?: string): Promise<string> {
  const [clientRecord] = await db.select().from(clients).where(eq(clients.id, clientId));
  if (clientRecord?.slug) return clientRecord.slug;

  const baseName = clientRecord?.name || clientName || "client";
  let baseSlug = slugify(baseName);
  if (!baseSlug) baseSlug = `client-${clientId.toLowerCase()}`;

  let slug = baseSlug;
  let counter = 1;
  while (true) {
    const existing = await db.select({ id: clients.id }).from(clients).where(eq(clients.slug, slug));
    if (existing.length === 0 || existing[0].id === clientId) break;
    slug = `${baseSlug}-${counter++}`;
  }

  if (clientRecord) {
    await db.update(clients).set({ slug }).where(eq(clients.id, clientId));
  }
  return slug;
}

