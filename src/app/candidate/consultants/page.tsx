import { requireRole } from "@/lib/auth";
import { db } from "@/db";
import { platformUsers } from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { ConsultantDirectoryClient } from "@/features/candidate-portal/components/ConsultantDirectoryClient";

export default async function ConsultantsPage() {
  const { platformUser } = await requireRole(["candidate"]);

  const consultants = await db
    .select({
      id: platformUsers.id,
      name: platformUsers.name,
      email: platformUsers.email,
      bio: platformUsers.bio,
      vertical: platformUsers.vertical,
      expertiseTags: platformUsers.expertiseTags,
      linkedinUrl: platformUsers.linkedinUrl,
      profilePic: platformUsers.consultantProfilePic,
    })
    .from(platformUsers)
    .where(
      and(
        inArray(platformUsers.role, ["consultant", "admin"]),
        eq(platformUsers.isDeleted, false),
        eq(platformUsers.status, "Active")
      )
    );

  return <ConsultantDirectoryClient consultants={consultants} />;
}
