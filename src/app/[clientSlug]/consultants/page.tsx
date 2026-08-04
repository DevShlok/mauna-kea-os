import { requireRole } from "@/lib/auth";
import { ConsultantDirectoryClient } from "@/features/candidate-portal/components/ConsultantDirectoryClient";
import { db } from "@/db";
import { platformUsers } from "@/db/schema";
import { inArray } from "drizzle-orm";

export default async function CandidateConsultantsPage() {
  await requireRole(["candidate"]);

  const rawUsers = await db
    .select()
    .from(platformUsers)
    .where(inArray(platformUsers.role, ["consultant", "admin"]));

  const consultants = rawUsers.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    bio: null,
    vertical: null,
    expertiseTags: null,
    linkedinUrl: null,
    profilePic: null,
  }));

  return <ConsultantDirectoryClient consultants={consultants} />;
}
