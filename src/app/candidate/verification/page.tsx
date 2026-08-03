import { requireRole } from "@/lib/auth";
import { db } from "@/db";
import { floatReferences } from "@/db/schema";
import { eq } from "drizzle-orm";
import { VerificationStatusClient } from "@/features/candidate-portal/components/VerificationStatusClient";

export default async function VerificationPage() {
  const { platformUser } = await requireRole(["candidate"]);
  const candId = platformUser!.linkedCandidateId!;

  const references = await db
    .select()
    .from(floatReferences)
    .where(eq(floatReferences.candId, candId));

  return <VerificationStatusClient candId={candId} refCount={references.length} />;
}
