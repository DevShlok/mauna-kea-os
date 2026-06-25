import { config } from "dotenv";
config({ path: ".env.local" });

async function main() {
  const { db } = await import("../src/db");
  const { mandates, clients } = await import("../src/db/schema");
  
  console.log("Fetching mandates...");
  const allMandates = await db.select({ company: mandates.company, consultant: mandates.consultant }).from(mandates);
  
  const uniqueCompanies = new Map();
  for (const m of allMandates) {
    if (!m.company) continue;
    if (!uniqueCompanies.has(m.company)) {
      uniqueCompanies.set(m.company, m.consultant);
    }
  }

  console.log(`Found ${uniqueCompanies.size} unique companies.`);
  
  const existingClients = await db.select({ name: clients.name }).from(clients);
  const existingClientNames = new Set(existingClients.map(c => c.name));

  let added = 0;
  for (const [companyName, consultant] of uniqueCompanies.entries()) {
    if (!existingClientNames.has(companyName)) {
      await db.insert(clients).values({
        id: "C-" + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
        name: companyName,
        owner: consultant || "",
        status: "Active",
      });
      console.log(`Added client: ${companyName}`);
      added++;
    }
  }

  console.log(`Successfully added ${added} new clients.`);
  process.exit(0);
}

main().catch(console.error);
