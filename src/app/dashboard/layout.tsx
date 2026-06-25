import { Sidebar } from "@/components/shared/Sidebar";
import { Topbar } from "@/components/shared/Topbar";
import { currentUser } from "@clerk/nextjs/server";
import { SignOutButton } from "@clerk/nextjs";
import { getUserByEmail } from "@/db/queries";
import { db } from "@/db";
import { platformUsers, candidates } from "@/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

// Route access map: which roles can access which route prefixes
const ROUTE_ACCESS: Record<string, string[]> = {
  "/dashboard/clients": ["admin", "consultant", "client"],
  "/dashboard/mandates": ["admin", "consultant", "client"],
  "/dashboard/candidates": ["admin", "consultant", "candidate"],
  "/dashboard/float-list": ["admin", "consultant"],
  "/dashboard/workbench": ["admin", "consultant", "client", "candidate"],
  "/dashboard/frameworks": ["admin", "consultant"],
  "/dashboard/admin": ["admin"],
  "/dashboard/analytics": ["admin", "consultant"],
};

// Default landing page per role
const DEFAULT_PAGE: Record<string, string> = {
  admin: "/dashboard/mandates",
  consultant: "/dashboard/mandates",
  client: "/dashboard/mandates",
  candidate: "/dashboard/candidates",
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await currentUser();
  const email = user?.primaryEmailAddress?.emailAddress;
  const fullName = user?.fullName || user?.firstName || "User";

  if (!email) {
    redirect("/sign-in");
  }

  // Look up the user in platform_users
  let platformUser = await getUserByEmail(email);

  // If not found, auto-register based on domain
  if (!platformUser) {
    const isMaunaKea = email.endsWith("@maunakea.co.in");
    const role = isMaunaKea ? "consultant" : "candidate";
    const userId = "U-" + Math.floor(Math.random() * 10000);
    const initials = fullName.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase();

    if (role === "candidate") {
      // Create a candidate record first
      const candId = "C-" + Date.now().toString();
      await db.insert(candidates).values({
        id: candId,
        name: fullName,
        email: email,
        initials,
      });

      await db.insert(platformUsers).values({
        id: userId,
        name: fullName,
        email: email,
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
        email: email,
        role: "consultant",
        status: "Active",
        initials,
        lastActive: new Date(),
      });
    }

    platformUser = await getUserByEmail(email);
  }

  const userRole = platformUser?.role || "candidate";
  const linkedClientId = platformUser?.linkedClientId || undefined;
  const linkedCandidateId = platformUser?.linkedCandidateId || undefined;

  // Update lastActive silently
  if (platformUser?.id) {
    db.update(platformUsers)
      .set({ lastActive: new Date() })
      .where(eq(platformUsers.id, platformUser.id))
      .then(() => {})
      .catch(() => {});
  }

  return (
    <div className="flex flex-row h-screen overflow-hidden bg-[#f0f4fb] print:h-auto print:overflow-visible print:bg-white">
      <div className="print:hidden">
        <Sidebar userRole={userRole} linkedClientId={linkedClientId} linkedCandidateId={linkedCandidateId} />
      </div>
      <div className="flex-1 flex flex-col overflow-hidden print:overflow-visible">
        <div className="print:hidden">
          <Topbar userRole={userRole} />
        </div>
        <main className="flex-1 overflow-y-auto p-6 print:p-0 print:overflow-visible">
          {children}
        </main>
      </div>
    </div>
  );
}
