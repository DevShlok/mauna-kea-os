import { requireRole } from "@/lib/auth";
import { ClientSidebar } from "@/features/client/components/ClientSidebar";
import { ClientTopbar } from "@/features/client/components/ClientTopbar";
import { ClientPortalProvider } from "@/features/client/context/ClientPortalContext";
import { CandidateSidebar } from "@/features/candidate-portal/components/CandidateSidebar";
import { CandidateTopbar } from "@/features/candidate-portal/components/CandidateTopbar";
import { Suspense } from "react";
import { db } from "@/db";
import { clients, candidates, candidateNotifications } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { getOrCreateCandidateSlug } from "@/lib/slug";

export default async function DynamicSlugLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ clientSlug: string }> | { clientSlug: string };
}) {
  const resolvedParams = await params;
  const slug = resolvedParams.clientSlug;

  // 1. Check if client
  const [client] = await db.select().from(clients).where(eq(clients.slug, slug));
  
  if (client) {
    const { platformUser } = await requireRole(["client"]);
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

  // 2. Check if candidate
  const [candidate] = await db.select().from(candidates).where(eq(candidates.slug, slug));

  if (candidate) {
    const { platformUser } = await requireRole(["candidate"]);
    if (platformUser.linkedCandidateId !== candidate.id) {
      if (platformUser.linkedCandidateId) {
        const ownSlug = await getOrCreateCandidateSlug(platformUser.linkedCandidateId, platformUser.name);
        if (ownSlug) {
          redirect(`/${ownSlug}`);
        }
      }
      notFound();
    }

    const unreadRows = candidate.id
      ? await db
          .select()
          .from(candidateNotifications)
          .where(
            and(
              eq(candidateNotifications.candId, candidate.id),
              eq(candidateNotifications.isRead, false)
            )
          )
      : [];

    return (
      <div className="flex flex-row h-screen overflow-hidden bg-[#eef2f7] text-[#1e293b]">
        <CandidateSidebar
          userName={platformUser?.name || candidate.name || "Candidate"}
          unreadCount={unreadRows.length}
          candidateSlug={candidate.slug || ""}
        />
        <div className="flex-1 flex flex-col overflow-hidden">
          <CandidateTopbar
            candId={candidate.id}
            userName={platformUser?.name || candidate.name || "Candidate"}
          />
          <main className="flex-1 overflow-y-auto bg-[#eef2f7]">
            <div className="p-6">{children}</div>
          </main>
        </div>
      </div>
    );
  }

  notFound();
}
