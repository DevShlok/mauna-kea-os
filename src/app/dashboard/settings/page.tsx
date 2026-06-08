import { getPlatformUsers } from "@/db/queries";
import SettingsClient from "./SettingsClient";

export default async function SettingsPage() {
  const users = await getPlatformUsers();
  return <SettingsClient initialUsers={users} />;
}
