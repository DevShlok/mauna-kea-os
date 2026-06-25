import NewCandidateClient from "@/features/candidates/components/NewCandidateClient";
import { currentUser } from "@clerk/nextjs/server";
import { getUserByEmail, getMandates } from "@/db/queries";

export default async function NewFloatListCandidatePage() {
  const user = await currentUser();
  let userRole = "consultant";
  let readOnly = false;
  let linkedCandidateId = "";
  
  if (user?.primaryEmailAddress?.emailAddress) {
    const pUser = await getUserByEmail(user.primaryEmailAddress.emailAddress);
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
