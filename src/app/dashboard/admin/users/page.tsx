import { requireRole } from "@/lib/auth";
import { getPlatformUsers } from "@/db/queries";
import { db } from "@/db";
import { clients, timeLogs } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import UsersClient from "@/features/admin/components/UsersClient";

export default async function AdminUsersPage() {
  await requireRole(["admin"]);

  const users = await getPlatformUsers();
  const allClients = await db.select().from(clients).where(eq(clients.isDeleted, false));
  
  // Fetch time logs to determine current status
  const allLogs = await db.select().from(timeLogs).orderBy(desc(timeLogs.timestamp));
  const latestLogPerUser = new Map();
  
  for (const log of allLogs) {
    if (!latestLogPerUser.has(log.userId)) {
      latestLogPerUser.set(log.userId, log.action);
    }
  }

  const usersWithStatus = users.map(user => {
    const action = latestLogPerUser.get(user.id);
    let currentStatus = "Clocked Out";
    if (action === 'clock_in' || action === 'break_end') currentStatus = "Clocked In";
    else if (action === 'break_start') currentStatus = "On Break";
    
    return { ...user, currentStatus };
  });
  
  return <UsersClient initialUsers={usersWithStatus} clients={allClients} />;
}
