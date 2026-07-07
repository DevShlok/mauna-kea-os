import { requireRole } from "@/lib/auth";
import { getPlatformUsers } from "@/db/queries";
import TimesheetsClient from "./TimesheetsClient";

export default async function TimesheetsPage() {
  await requireRole(["admin"]);
  const users = await getPlatformUsers();
  const consultants = users.filter((u: any) => u.role === 'consultant');

  return <TimesheetsClient users={consultants} />;
}
