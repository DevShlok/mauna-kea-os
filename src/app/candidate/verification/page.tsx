import { requireRole } from "@/lib/auth";
import { getOrCreateCandidateSlug } from "@/lib/slug";
import { redirect } from "next/navigation";

export default async function CandidateVerificationRedirect() {
  const { platformUser } = await requireRole(["candidate"]);
  if (platformUser.linkedCandidateId) {
    const slug = await getOrCreateCandidateSlug(platformUser.linkedCandidateId, platformUser.name);
    if (slug) {
      redirect(`/${slug}/verification`);
    }
  }
  redirect("/sign-in");
}
