import { Suspense } from "react";
import { getMandates, getCandidateById } from "@/db/queries";
import { getCandidateFloatsAction, getCandidateNotificationsAction } from "@/actions/candidate-portal";
import { requireRole } from "@/lib/auth";
import { db } from "@/db";
import { clients, candidates } from "@/db/schema";
import { eq } from "drizzle-orm";
import ClientDashboard from "@/features/client/components/ClientDashboard";
import { CandidateHome } from "@/features/candidate-portal/components/CandidateHome";
import { OnboardingShell } from "@/features/candidate-portal/onboarding/OnboardingShell";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ clientSlug: string }>;
  searchParams: Promise<{ tab?: string }>;
};

export default async function DynamicSlugPage(props: PageProps) {
  const { clientSlug: slug } = await props.params;
  const searchParams = await props.searchParams;
  const tab = searchParams.tab || "dashboard";

  const { platformUser } = await requireRole(["admin", "consultant", "client", "candidate"]);

  // 1. Check if client
  let [client] = await db.select().from(clients).where(eq(clients.slug, slug));
  if (!client && platformUser?.linkedClientId) {
    [client] = await db.select().from(clients).where(eq(clients.id, platformUser.linkedClientId));
  } else if (!client && (slug === "client" || platformUser?.role === "client" || platformUser?.role === "admin" || platformUser?.role === "consultant")) {
    const allClients = await db.select().from(clients).limit(1);
    client = allClients[0] || { id: "client", name: "Client Portal", slug: "client" };
  }

  if (platformUser?.role === "client" || (client && platformUser?.role !== "candidate")) {
    const allMandates = await getMandates();
    const filteredMandates = allMandates.filter(m => m.company === client.name).map(m => ({
      ...m,
      candidates: m.candidates.filter(c => c.isSentToClient)
    }));
    const clientName = (platformUser?.role === "client" ? platformUser?.name : client.name) || client.name;
    const clientSlug = client.slug || slug;
    return (
      <Suspense fallback={<div className="flex items-center justify-center min-h-screen bg-[#f4f6fb]">Loading...</div>}>
        <ClientDashboard clientSlug={clientSlug} clientName={clientName} mandates={filteredMandates} initialTab={tab as any} />
      </Suspense>
    );
  }

  // 2. Check if candidate
  let [candidate] = await db.select().from(candidates).where(eq(candidates.slug, slug));
  if (!candidate && platformUser?.linkedCandidateId) {
    [candidate] = await db.select().from(candidates).where(eq(candidates.id, platformUser.linkedCandidateId));
  }

  if (candidate || platformUser?.role === "candidate") {
    const candId = candidate?.id || platformUser.linkedCandidateId!;
    const candidateSlug = candidate?.slug || slug;

    const { candidateVerifications } = await import('@/db/schema');
    const [candData, myFloats, recentNotifs, verifData] = await Promise.all([
      getCandidateById(candId),
      getCandidateFloatsAction(candId),
      getCandidateNotificationsAction(candId),
      candId
        ? db.select().from(candidateVerifications).where(eq(candidateVerifications.candId, candId)).limit(1)
        : Promise.resolve([])
    ]);
    const isVerified = verifData[0]?.status === 'Verified';

    const totalShared = myFloats.length;
    const awaiting = myFloats.filter(
      (f) => f.status === "Shared" || f.status === "Under Review"
    ).length;
    const interviewing = myFloats.filter((f) => f.status === "Interviewing").length;
    const feedbackAvailable = myFloats.filter(
      (f) => f.feedbackPositives || f.feedbackImprovements || f.feedbackNextSteps
    ).length;

    const isOnboarded = !!candidate?.profileCompletedAt;

    if (!isOnboarded) {
      return (
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen bg-[#f4f6fb]">Loading...</div>}>
          <OnboardingShell candId={candId} candidate={candData} />
        </Suspense>
      );
    }

    return (
      <CandidateHome
        candidate={{ ...candData, isVerified }}
        recentFloats={myFloats.slice(0, 5)}
        stats={{ totalShared, awaiting, interviewing, feedbackAvailable }}
        recentNotifs={recentNotifs.slice(0, 5)}
        candidateSlug={candidateSlug}
      />
    );
  }

  notFound();
}
