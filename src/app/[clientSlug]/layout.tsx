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

  const { platformUser } = await requireRole(["admin", "consultant", "client", "candidate"]);

  // 1. Check if client
  let [client] = await db.select().from(clients).where(eq(clients.slug, slug));

  if (!client) {
    if (platformUser?.linkedClientId) {
      [client] = await db.select().from(clients).where(eq(clients.id, platformUser.linkedClientId));
    } else if (slug === "client" || platformUser?.role === "client" || platformUser?.role === "admin" || platformUser?.role === "consultant") {
      const allClients = await db.select().from(clients).limit(1);
      client = allClients[0] || { id: "client", name: "Client Portal", slug: "client" };
    }
  }

  if (platformUser?.role === "client" || (client && platformUser?.role !== "candidate")) {
    if (platformUser.role === "client" && platformUser.linkedClientId && platformUser.linkedClientId !== client.id) {
      const [ownClient] = await db.select().from(clients).where(eq(clients.id, platformUser.linkedClientId));
      if (ownClient?.slug) {
        redirect(`/${ownClient.slug}`);
      }
    }

    const clientName = (platformUser?.role === "client" ? platformUser?.name : client.name) || client.name;
    return (
      <ClientPortalProvider>
        <div className="h-screen overflow-hidden bg-[#f4f6fb] flex print:h-auto print:overflow-visible">
          <div className="shrink-0 h-full z-50 print:hidden">
            <Suspense fallback={<div className="w-64 h-full bg-[#0b1f3a]"></div>}>
              <ClientSidebar clientName={clientName} clientSlug={client.slug || "client"} />
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
  let [candidate] = await db.select().from(candidates).where(eq(candidates.slug, slug));
  if (!candidate && platformUser?.linkedCandidateId) {
    [candidate] = await db.select().from(candidates).where(eq(candidates.id, platformUser.linkedCandidateId));
  }

  if (candidate || platformUser?.role === "candidate") {
    const candObj = candidate || { id: platformUser.linkedCandidateId || "", name: platformUser.name || "Candidate", slug: slug };
    if (platformUser.role === "candidate" && platformUser.linkedCandidateId && candObj.id && platformUser.linkedCandidateId !== candObj.id) {
      const ownSlug = await getOrCreateCandidateSlug(platformUser.linkedCandidateId, platformUser.name);
      if (ownSlug) {
        redirect(`/${ownSlug}`);
      }
    }

    const unreadRows = candObj.id
      ? await db
          .select()
          .from(candidateNotifications)
          .where(
            and(
              eq(candidateNotifications.candId, candObj.id),
              eq(candidateNotifications.isRead, false)
            )
          )
      : [];

    return (
      <div className="flex flex-row h-screen overflow-hidden bg-[#eef2f7] text-[#1e293b]">
        <CandidateSidebar
          userName={platformUser?.name || candObj.name || "Candidate"}
          unreadCount={unreadRows.length}
          candidateSlug={candObj.slug || slug}
        />
        <div className="flex-1 flex flex-col overflow-hidden">
          <CandidateTopbar
            candId={candObj.id}
            userName={platformUser?.name || candObj.name || "Candidate"}
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
