import { requireRole } from "@/lib/auth";
import { getPlatformUsers } from "@/db/queries";
import TimesheetsClient from "./TimesheetsClient";

export default async function TimesheetsPage() {
  await requireRole(["admin", "consultant"]);
  const users = await getPlatformUsers();
  const nonClientUsers = users.filter((u: any) => u.role !== 'client');
  return <TimesheetsClient users={nonClientUsers} />;
}
