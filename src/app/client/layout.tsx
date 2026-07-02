import { requireRole } from "@/lib/auth";
import { ClientSidebar } from "@/features/client/components/ClientSidebar";
import { ClientTopbar } from "@/features/client/components/ClientTopbar";
import { ClientPortalProvider } from "@/features/client/context/ClientPortalContext";
import { Suspense } from "react";

export default async function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Enforce client-only access at the layout level
  const { platformUser } = await requireRole(["client"]);
  const clientName = platformUser?.name || "Client";

  return (
    <ClientPortalProvider>
      <div className="h-screen overflow-hidden bg-[#f4f6fb] flex">
        <div className="shrink-0 h-full z-50 print:hidden">
          <Suspense fallback={<div className="w-64 h-full bg-[#0b1f3a]"></div>}>
            <ClientSidebar clientName={clientName} />
          </Suspense>
        </div>
        <div className="flex-1 flex flex-col h-full overflow-hidden relative">
          <div className="print:hidden">
            <ClientTopbar />
          </div>
          {children}
        </div>
      </div>
    </ClientPortalProvider>
  );
}
