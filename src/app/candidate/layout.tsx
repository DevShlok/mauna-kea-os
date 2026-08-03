import { requireRole } from "@/lib/auth";
import { db } from "@/db";
import { candidateNotifications } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { CandidateSidebar } from "@/features/candidate-portal/components/CandidateSidebar";
import { CandidateTopbar } from "@/features/candidate-portal/components/CandidateTopbar";

export default async function CandidateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { platformUser } = await requireRole(["candidate"]);
  const linkedCandidateId = platformUser?.linkedCandidateId;

  // Fetch unread count for topbar bell
  const unreadRows = linkedCandidateId
    ? await db
        .select()
        .from(candidateNotifications)
        .where(
          and(
            eq(candidateNotifications.candId, linkedCandidateId),
            eq(candidateNotifications.isRead, false)
          )
        )
    : [];

  return (
    <div
      className="flex flex-row h-screen overflow-hidden bg-[#eef2f7] text-[#1e293b]"
    >
      <CandidateSidebar
        userName={platformUser?.name || "Candidate"}
        unreadCount={unreadRows.length}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <CandidateTopbar
          candId={linkedCandidateId || ""}
          userName={platformUser?.name || "Candidate"}
        />
        <main
          className="flex-1 overflow-y-auto bg-[#eef2f7]"
        >
          <div className="p-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
