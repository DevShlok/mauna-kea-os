import { Sidebar } from "@/components/shared/Sidebar";
import { Topbar } from "@/components/shared/Topbar";
import { requireRole } from "@/lib/auth";
import { db } from "@/db";
import { platformUsers } from "@/db/schema";
import { eq } from "drizzle-orm";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { platformUser, userRole } = await requireRole(["admin", "consultant"]);

  const linkedClientId = platformUser?.linkedClientId || undefined;
  const linkedCandidateId = platformUser?.linkedCandidateId || undefined;

  // Update lastActive synchronously to prevent connection pool exhaustion in Next.js 15
  if (platformUser?.id) {
    try {
      await db.update(platformUsers)
        .set({ lastActive: new Date() })
        .where(eq(platformUsers.id, platformUser.id));
    } catch(e) {
      console.error("Failed to update lastActive", e);
    }
  }

  return (
    <div className="flex flex-row h-screen overflow-hidden bg-[#f0f4fb] print:h-auto print:overflow-visible print:bg-white">
      <div className="print:hidden">
        <Sidebar userRole={userRole} linkedClientId={linkedClientId} linkedCandidateId={linkedCandidateId} userName={platformUser?.name || "User"} />
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
