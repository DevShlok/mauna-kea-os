import { requireRole } from "@/lib/auth";
import { getCandidateById } from "@/db/queries";
import { getBenchmarkAction } from "@/actions/benchmarking";
import { BenchmarkingClient } from "@/features/candidate-portal/components/BenchmarkingClient";

export const dynamic = "force-dynamic";

export default async function CandidateBenchmarkingPage() {
  const { platformUser } = await requireRole(["candidate"]);
  const candId = platformUser!.linkedCandidateId!;
  const candidate = await getCandidateById(candId);

  const designation = candidate?.designation ?? "";
  const exp = candidate?.exp ?? 8;
  const location = candidate?.location ?? "";

  const initialBenchmark = await getBenchmarkAction({
    candId,
    designation,
    expMin: Math.max(0, Math.round(exp) - 3),
    expMax: Math.round(exp) + 3,
    location,
  });

  return (
    <BenchmarkingClient
      candId={candId}
      candidateName={candidate?.name ?? "Candidate"}
      initialDesignation={designation}
      initialExp={exp}
      initialLocation={location}
      initialBenchmark={initialBenchmark}
    />
  );
}
