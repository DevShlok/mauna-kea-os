import { requireRole } from "@/lib/auth";
import { ConsultantDirectoryClient } from "@/features/candidate-portal/components/ConsultantDirectoryClient";
import { db } from "@/db";
import { platformUsers } from "@/db/schema";
import { inArray, eq, and } from "drizzle-orm";

export default async function CandidateConsultantsPage() {
  await requireRole(["candidate"]);

  const rawUsers = await db
    .select()
    .from(platformUsers)
    .where(and(inArray(platformUsers.role, ["consultant", "admin"]), eq(platformUsers.isDeleted, false)));

  const consultants = rawUsers.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    bio: u.bio || null,
    vertical: u.vertical || null,
    expertiseTags: u.expertiseTags || [],
    linkedinUrl: u.linkedinUrl || null,
    profilePic: u.consultantProfilePic || null,
  }));

  return <ConsultantDirectoryClient consultants={consultants} />;
}

