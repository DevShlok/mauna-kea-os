import { requireRole } from "@/lib/auth";
import { getFrameworks } from "@/db/queries";
import CreateMandateClient from "@/features/mandates/components/CreateMandateClient";

import { Suspense } from "react";
import { db } from "@/db";
import { masterLocations, masterClients, masterIndustries } from "@/db/schema";
import { asc } from "drizzle-orm";

export default async function CreateMandatePage() {
  await requireRole(["admin", "consultant"]);

  const frameworks = await getFrameworks();
  const locations = await db.select().from(masterLocations).orderBy(asc(masterLocations.id));
  const clients = await db.select().from(masterClients).orderBy(asc(masterClients.id));
  const industries = await db.select().from(masterIndustries).orderBy(asc(masterIndustries.id));

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CreateMandateClient 
        frameworks={frameworks} 
        masterLocations={locations} 
        masterClients={clients} 
        masterIndustries={industries} 
      />
    </Suspense>
  );
}
