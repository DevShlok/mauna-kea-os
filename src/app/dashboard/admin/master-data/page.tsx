import { requireRole } from "@/lib/auth";
import { db } from "@/db";
import { masterClients, masterIndustries, masterLocations } from "@/db/schema";
import MasterDataClient from "@/features/master-data/components/MasterDataClient";

export const dynamic = "force-dynamic";

export default async function MasterDataPage() {
  await requireRole(["admin"]);

  const clients = await db.select().from(masterClients);
  const industries = await db.select().from(masterIndustries);
  const locations = await db.select().from(masterLocations);

  return <MasterDataClient initialClients={clients} initialIndustries={industries} initialLocations={locations} />;
}
