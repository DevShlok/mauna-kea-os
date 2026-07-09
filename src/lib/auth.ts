import { createClient } from "@/utils/supabase/server";
import { getUserByEmail } from "@/db/queries";
import { redirect } from "next/navigation";
import { cache } from "react";

export const requireRole = cache(async (allowedRoles: string[]) => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const email = user?.email;

  if (!email || !user) {
    redirect("/sign-in");
  }

  let platformUser = await getUserByEmail(email);

  if (!platformUser) {
    const fullName = user.user_metadata?.full_name || "User";
    const isMaunaKea = email.endsWith("@maunakea.co.in");
    const role = isMaunaKea ? "consultant" : "candidate";
    const userId = "U-" + Math.floor(Math.random() * 10000);
    const initials = fullName.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase();

    const { db } = await import("@/db");
    const { platformUsers, candidates } = await import("@/db/schema");

    if (role === "candidate") {
      const candId = "C-" + Date.now().toString();
      await db.insert(candidates).values({ id: candId, name: fullName, email, initials });
      await db.insert(platformUsers).values({
        id: userId, name: fullName, email, role: "candidate", status: "Active", initials, linkedCandidateId: candId, lastActive: new Date()
      });
    } else {
      await db.insert(platformUsers).values({
        id: userId, name: fullName, email, role: "consultant", status: "Active", initials, lastActive: new Date()
      });
    }
    platformUser = await getUserByEmail(email);
  }

  const userRole = platformUser?.role || "candidate";

  if (!allowedRoles.includes(userRole)) {
    // Unauthorized! Route them to their proper portal based on their actual role
    if (userRole === "client") {
      redirect("/client/mandates");
    } else if (userRole === "candidate") {
      redirect("/candidate");
    } else {
      redirect("/dashboard");
    }
  }

  return { platformUser, userRole, email, supabaseUser: user };
});
