import { requireRole } from "@/lib/auth";
import { getCandidateById } from "@/db/queries";
import { getCandidateFloatsAction, getCandidateNotificationsAction } from "@/actions/candidate-portal";
import { CandidateHome } from "@/features/candidate-portal/components/CandidateHome";

export default async function CandidateHomePage() {
  const { platformUser } = await requireRole(["candidate"]);
  const candId = platformUser!.linkedCandidateId!;

  const [candidate, myFloats, recentNotifs] = await Promise.all([
    getCandidateById(candId),
    getCandidateFloatsAction(candId),
    getCandidateNotificationsAction(candId),
  ]);

  // Derived stats
  const totalShared = myFloats.length;
  const awaiting = myFloats.filter(
    (f) => f.status === "Shared" || f.status === "Under Review"
  ).length;
  const interviewing = myFloats.filter((f) => f.status === "Interviewing").length;
  const feedbackAvailable = myFloats.filter(
    (f) => f.feedbackPositives || f.feedbackImprovements || f.feedbackNextSteps
  ).length;

  return (
    <CandidateHome
      candidate={candidate}
      recentFloats={myFloats.slice(0, 5)}
      stats={{ totalShared, awaiting, interviewing, feedbackAvailable }}
      recentNotifs={recentNotifs.slice(0, 5)}
    />
  );
}
