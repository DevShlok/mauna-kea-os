import { getFrameworks } from "@/db/queries";
import CreateMandateClient from "@/features/mandates/components/CreateMandateClient";

import { Suspense } from "react";

export default async function CreateMandatePage() {
  const frameworks = await getFrameworks();
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CreateMandateClient frameworks={frameworks} />
    </Suspense>
  );
}
