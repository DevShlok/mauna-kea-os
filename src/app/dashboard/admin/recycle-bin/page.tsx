import { requireRole } from "@/lib/auth";
import { db } from "@/db";
import { clients, mandates, candidates, floats, platformUsers, frameworks } from "@/db/schema";
import { eq } from "drizzle-orm";
import RecycleBinClient from "@/features/admin/components/RecycleBinClient";

export const metadata = {
  title: "Recycle Bin - Admin | Mauna Kea",
};

export default async function RecycleBinPage() {
  await requireRole(["admin"]);

  const deletedClients = await db.select().from(clients).where(eq(clients.isDeleted, true));
  const deletedMandates = await db.select().from(mandates).where(eq(mandates.isDeleted, true));
  const deletedCandidates = await db.select().from(candidates).where(eq(candidates.isDeleted, true));
  const deletedFloats = await db.select().from(floats).where(eq(floats.isDeleted, true));
  const deletedUsers = await db.select().from(platformUsers).where(eq(platformUsers.isDeleted, true));
  const deletedFrameworks = await db.select().from(frameworks).where(eq(frameworks.isDeleted, true));

  let globalId = 0;
  const items: any[] = [];
  deletedClients.forEach(c => items.push({ id: globalId++, originalId: c.id, type: "Clients", name: c.name, deletedBy: c.deletedBy, deletedAt: c.deletedAt }));
  deletedMandates.forEach(m => items.push({ id: globalId++, originalId: m.id, type: "Mandates", name: m.role + " at " + m.company, deletedBy: m.deletedBy, deletedAt: m.deletedAt }));
  deletedCandidates.forEach(c => items.push({ id: globalId++, originalId: c.id, type: "Candidates", name: c.name, deletedBy: c.deletedBy, deletedAt: c.deletedAt }));
  deletedFloats.forEach(f => items.push({ id: globalId++, originalId: f.id, type: "Floats", name: f.candName + " for " + f.client, deletedBy: f.deletedBy, deletedAt: f.deletedAt }));
  deletedUsers.forEach(u => items.push({ id: globalId++, originalId: u.id, type: "Users", name: u.name + " (" + u.email + ")", deletedBy: u.deletedBy, deletedAt: u.deletedAt }));
  deletedFrameworks.forEach(f => items.push({ id: globalId++, originalId: f.id, type: "Frameworks", name: f.name, deletedBy: f.deletedBy, deletedAt: f.deletedAt }));

  items.sort((a, b) => new Date(b.deletedAt).getTime() - new Date(a.deletedAt).getTime());

  return <RecycleBinClient items={items} />;
}
