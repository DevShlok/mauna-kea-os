import { requireRole } from "@/lib/auth";
import { getUsersPaginated } from "@/db/queries";
import { db } from "@/db";
import { clients, timeLogs } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import UsersClient from "@/features/admin/components/UsersClient";

export default async function AdminUsersPage(
  props: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }
) {
  await requireRole(["admin"]);

  const p = await props.searchParams;
  const page = Number(p.page) || 1;
  const limit = Number(p.pageSize) || 50;
  const search = typeof p.search === "string" ? p.search : "";
  const sortKey = typeof p.sortKey === "string" ? p.sortKey : "createdAt";
  const sortDir = p.sortDir === "asc" ? "asc" : "desc";
  const role = typeof p.role === "string" ? p.role : "";

  const data = await getUsersPaginated({ page, limit, search, sortKey, sortDir, role });
  const allClients = await db.select().from(clients).where(eq(clients.isDeleted, false));

  // Fetch time logs to determine current status
  const allLogs = await db.select().from(timeLogs).orderBy(desc(timeLogs.timestamp));
  const latestLogPerUser = new Map<string, string>();

  for (const log of allLogs) {
    if (!latestLogPerUser.has(log.userId)) {
      latestLogPerUser.set(log.userId, log.action);
    }
  }

  const usersWithStatus = data.rows.map((user) => {
    const action = latestLogPerUser.get(user.id);
    let currentStatus = "Clocked Out";
    if (action === "clock_in" || action === "break_end") currentStatus = "Clocked In";
    else if (action === "break_start") currentStatus = "On Break";
    return { ...user, currentStatus };
  });

  return <UsersClient initialUsers={usersWithStatus} clients={allClients} metadata={data.metadata} />;
}
