import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";

export default async function CandidateHomePage() {
  await requireRole(["candidate"]);
  redirect("/candidate/profile");
}
