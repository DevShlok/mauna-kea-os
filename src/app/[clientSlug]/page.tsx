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

  // 1. Check if client
  const [client] = await db.select().from(clients).where(eq(clients.slug, slug));
  if (client) {
    const { platformUser } = await requireRole(["client"]);
    const allMandates = await getMandates();
    const filteredMandates = allMandates.filter(m => m.company === client.name).map(m => ({
      ...m,
      candidates: m.candidates.filter(c => c.isSentToClient)
    }));
    const clientName = platformUser?.name || client.name;
    return (
      <Suspense fallback={<div className="flex items-center justify-center min-h-screen bg-[#f4f6fb]">Loading...</div>}>
        <ClientDashboard clientSlug={slug} clientName={clientName} mandates={filteredMandates} initialTab={tab as any} />
      </Suspense>
    );
  }

  // 2. Check if candidate
  const [candidate] = await db.select().from(candidates).where(eq(candidates.slug, slug));
  if (candidate) {
    const { platformUser } = await requireRole(["candidate"]);
    const candId = platformUser!.linkedCandidateId!;

    const { candidateVerifications } = await import('@/db/schema');
    const [candData, myFloats, recentNotifs, verifData] = await Promise.all([
      getCandidateById(candId),
      getCandidateFloatsAction(candId),
      getCandidateNotificationsAction(candId),
      db.select().from(candidateVerifications).where(eq(candidateVerifications.candId, candId)).limit(1)
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

    const isOnboarded = !!candidate.profileCompletedAt;

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
        candidateSlug={slug}
      />
    );
  }

  notFound();
}
