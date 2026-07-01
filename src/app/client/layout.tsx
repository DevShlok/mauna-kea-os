import { Sidebar } from "@/components/shared/Sidebar";
import { Topbar } from "@/components/shared/Topbar";
import { requireRole } from "@/lib/auth";

export default async function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { platformUser, userRole } = await requireRole(["client"]);
  const linkedClientId = platformUser?.linkedClientId || undefined;
  const linkedCandidateId = platformUser?.linkedCandidateId || undefined;

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
