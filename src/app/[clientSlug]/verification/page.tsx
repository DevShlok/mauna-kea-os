import { requireRole } from "@/lib/auth";
import { VerificationStatusClient } from "@/features/candidate-portal/components/VerificationStatusClient";
import { db } from "@/db";
import { floatReferences } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export default async function CandidateVerificationPage() {
  const { platformUser } = await requireRole(["candidate"]);
  const candId = platformUser!.linkedCandidateId!;

  const refs = candId
    ? await db
        .select()
        .from(floatReferences)
        .where(and(eq(floatReferences.candId, candId), eq(floatReferences.isDeleted, false)))
    : [];

  return <VerificationStatusClient candId={candId} refCount={refs.length} />;
}
