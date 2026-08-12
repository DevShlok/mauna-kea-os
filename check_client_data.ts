import { db } from "./src/db";
import { platformUsers, clients, mandates } from "./src/db/schema";
import { eq } from "drizzle-orm";

async function checkClientData() {
  console.log("=== PLATFORM USERS WITH ROLE CLIENT ===");
  const clientUsers = await db.select().from(platformUsers).where(eq(platformUsers.role, "client"));
  console.log(JSON.stringify(clientUsers, null, 2));

  console.log("=== ALL CLIENTS ===");
  const allClients = await db.select().from(clients);
  console.log(JSON.stringify(allClients, null, 2));

  console.log("=== ALL MANDATES ===");
  const allMandates = await db.select({ id: mandates.id, company: mandates.company, role: mandates.role }).from(mandates);
  console.log(JSON.stringify(allMandates, null, 2));

  process.exit(0);
}

checkClientData().catch(err => {
  console.error(err);
  process.exit(1);
});
