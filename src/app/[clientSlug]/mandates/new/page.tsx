import { Suspense } from "react";
import { requireRole } from "@/lib/auth";
import { db } from "@/db";
import { clients } from "@/db/schema";
import { eq } from "drizzle-orm";
import CreateMandateClient from "@/features/mandates/components/CreateMandateClient";

export const dynamic = "force-dynamic";

export default async function ClientNewMandatePage({ params }: { params: Promise<{ clientSlug: string }> }) {
  const { clientSlug } = await params;
  const { platformUser } = await requireRole(["client"]);
  
  let clientName = "Client";
  if (platformUser?.linkedClientId) {
    const [client] = await db.select().from(clients).where(eq(clients.id, platformUser.linkedClientId));
    if (client) {
      clientName = client.name;
    }
  }
  const currentUser = platformUser?.name || "System";

  return (
    <div className="flex-1 overflow-y-auto w-full bg-[#f4f6fb] pt-8">
      <Suspense fallback={<div className="flex items-center justify-center h-full">Loading...</div>}>
        <CreateMandateClient clientSlug={clientSlug} frameworks={[]} isClientMode={true} clientName={clientName} currentUser={currentUser} />
      </Suspense>
    </div>
  );
}
