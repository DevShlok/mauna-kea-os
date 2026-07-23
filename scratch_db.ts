import { db } from "./src/db/index";
import { sql } from "drizzle-orm";

async function main() {
  const users = await db.query.platformUsers.findMany();
  console.log("USERS:", users);
  
  const frameworks = await db.query.frameworks.findMany();
  console.log("FRAMEWORKS:", frameworks.map(f => f.id));
  process.exit(0);
}

main().catch(console.error);
