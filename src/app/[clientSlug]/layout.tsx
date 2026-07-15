import { requireRole } from "@/lib/auth";
import { ClientSidebar } from "@/features/client/components/ClientSidebar";
import { ClientTopbar } from "@/features/client/components/ClientTopbar";
import { ClientPortalProvider } from "@/features/client/context/ClientPortalContext";
import { Suspense } from "react";
import { db } from "@/db";
import { clients } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";

export default async function ClientLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ clientSlug: string }> | { clientSlug: string };
}) {
  const { platformUser } = await requireRole(["client"]);
  
  // Await params if Next.js 15+ (works in 14 too if we just use the object, but awaiting is safer if it's a promise)
  const resolvedParams = await params;
  const clientSlug = resolvedParams.clientSlug;
  
  // 1. Fetch the client by slug
  const [client] = await db.select().from(clients).where(eq(clients.slug, clientSlug));
  
  if (!client) {
    notFound();
  }

  // 2. Authorize
  if (platformUser.linkedClientId !== client.id) {
    if (platformUser.linkedClientId) {
      const [ownClient] = await db.select().from(clients).where(eq(clients.id, platformUser.linkedClientId));
      if (ownClient?.slug) {
        redirect(`/${ownClient.slug}/mandates`);
      }
    }
    notFound();
  }

  const clientName = platformUser?.name || client.name;

  return (
    <ClientPortalProvider>
      <div className="h-screen overflow-hidden bg-[#f4f6fb] flex print:h-auto print:overflow-visible">
        <div className="shrink-0 h-full z-50 print:hidden">
          <Suspense fallback={<div className="w-64 h-full bg-[#0b1f3a]"></div>}>
            <ClientSidebar clientName={clientName} clientSlug={client.slug || ""} />
          </Suspense>
        </div>
        <div className="flex-1 flex flex-col h-full overflow-hidden relative print:h-auto print:overflow-visible">
          <div className="print:hidden">
            <ClientTopbar />
          </div>
          {children}
        </div>
      </div>
    </ClientPortalProvider>
  );
}
