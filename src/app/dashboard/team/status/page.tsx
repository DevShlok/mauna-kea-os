import { requireRole } from "@/lib/auth";
import { getPlatformUsers } from "@/db/queries";
import TimesheetsClient from "./TimesheetsClient";

export default async function TimesheetsPage() {
  await requireRole(["admin", "consultant"]);
  const users = await getPlatformUsers();
  const teamUsers = users.filter((u: any) => u.role === 'admin' || u.role === 'consultant');
  return <TimesheetsClient users={teamUsers} />;
}
