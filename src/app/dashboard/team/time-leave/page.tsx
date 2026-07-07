import { requireRole } from "@/lib/auth";
import TimeLeaveClient from "./TimeLeaveClient";

export default async function TimeLeavePage() {
  await requireRole(["admin", "consultant"]);
  return <TimeLeaveClient />;
}
