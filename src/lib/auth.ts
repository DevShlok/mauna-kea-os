import { db } from "@/db";
import { clients, platformUsers, candidates } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createClient } from "@/utils/supabase/server";
import { getUserByEmail } from "@/db/queries";
import { redirect } from "next/navigation";
import { cache } from "react";
import { getOrCreateCandidateSlug, slugify } from "@/lib/slug";
import { newUserId, newCandId } from "@/lib/ids";

// Helper function to safely find or create a candidate record by email
async function findOrCreateCandidateId(email: string, name: string): Promise<string> {
  // 1. Check if candidate record already exists with this email
  const [existing] = await db
    .select({ id: candidates.id, slug: candidates.slug })
    .from(candidates)
    .where(eq(candidates.email, email))
    .limit(1);

  if (existing?.id) {
    if (!existing.slug) {
      await getOrCreateCandidateSlug(existing.id, name);
    }
    return existing.id;
  }

  // 2. Generate robust unique ID
  const candId = newCandId();
  const initials = (name || "User")
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  const baseSlug = slugify(name || "candidate") || `cand-${candId.toLowerCase()}`;

  try {
    await db.insert(candidates).values({
      id: candId,
      slug: baseSlug,
      name,
      email,
      initials,
    });
    return candId;
  } catch (err) {
    // In case of race condition or duplicate key, fetch the candidate that was created
    const [retry] = await db
      .select({ id: candidates.id })
      .from(candidates)
      .where(eq(candidates.email, email))
      .limit(1);
    const retryId = retry?.id || candId;
    await getOrCreateCandidateSlug(retryId, name);
    return retryId;
  }
}

export const requireRole = cache(async (allowedRoles: string[]) => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const email = user?.email;

  if (!email || !user) {
    redirect("/sign-in");
  }

  let platformUser = await getUserByEmail(email);

  if (!platformUser) {
    const fullName =
      user.user_metadata?.full_name || email.split("@")[0] || "User";
    const isMaunaKea = email.endsWith("@maunakea.co.in");
    const role = isMaunaKea ? "consultant" : "candidate";
    const userId = newUserId();
    const initials = fullName
      .split(" ")
      .map((n: string) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();

    if (role === "candidate") {
      const candId = await findOrCreateCandidateId(email, fullName);
      await db.insert(platformUsers).values({
        id: userId,
        name: fullName,
        email,
        role: "candidate",
        status: "Active",
        initials,
        linkedCandidateId: candId,
        lastActive: new Date(),
      });
    } else {
      await db.insert(platformUsers).values({
        id: userId,
        name: fullName,
        email,
        role: "consultant",
        status: "Active",
        initials,
        lastActive: new Date(),
      });
    }
    platformUser = await getUserByEmail(email);
  }

  // Ensure candidate role always has a linked candidate record
  if (
    platformUser &&
    platformUser.role === "candidate" &&
    !platformUser.linkedCandidateId
  ) {
    const candId = await findOrCreateCandidateId(
      platformUser.email,
      platformUser.name
    );
    await db
      .update(platformUsers)
      .set({ linkedCandidateId: candId })
      .where(eq(platformUsers.id, platformUser.id));

    platformUser.linkedCandidateId = candId;
  }

  const userRole = platformUser?.role || "candidate";

  if (!allowedRoles.includes(userRole)) {
    // Route user to their designated portal based on role
    if (userRole === "client") {
      if (platformUser?.linkedClientId) {
        const [clientRecord] = await db
          .select()
          .from(clients)
          .where(eq(clients.id, platformUser.linkedClientId));
        if (clientRecord?.slug) {
          redirect(`/${clientRecord.slug}`);
        }
      }
      redirect("/sign-in");
    } else if (userRole === "candidate") {
      if (platformUser?.linkedCandidateId) {
        const slug = await getOrCreateCandidateSlug(
          platformUser.linkedCandidateId,
          platformUser.name
        );
        if (slug) {
          redirect(`/${slug}`);
        }
      }
      redirect("/sign-in");
    } else {
      redirect("/dashboard");
    }
  }

  return { platformUser, userRole, email, supabaseUser: user };
});

