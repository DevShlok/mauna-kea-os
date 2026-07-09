import { requireRole } from "@/lib/auth";
import NewCandidateClient from "@/features/candidates/components/NewCandidateClient";
import { getMandates } from "@/db/queries";

export default async function NewFloatListCandidatePage() {
  const { platformUser: pUser, email } = await requireRole(["admin", "consultant"]);

  let userRole = "consultant";
  let readOnly = false;
  let linkedCandidateId = "";
  
  if (email) {
    if (pUser) {
      userRole = pUser.role || "consultant";
      if (userRole === "candidate") {
        readOnly = true;
        linkedCandidateId = pUser.linkedCandidateId || "";
      }
    }
  }

  const mandates = await getMandates();

  return <NewCandidateClient userRole={userRole} readOnly={readOnly} mandates={mandates} linkedCandidateId={linkedCandidateId} />;
}
