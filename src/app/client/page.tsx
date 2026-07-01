import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";

export default async function ClientHomePage() {
  await requireRole(["client"]);
  redirect("/client/mandates");
}
