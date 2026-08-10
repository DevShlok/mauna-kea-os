import { requireRole } from "@/lib/auth";
import { getOrCreateCandidateSlug } from "@/lib/slug";
import { redirect } from "next/navigation";

export default async function CandidateGuidanceRedirect() {
  const { platformUser } = await requireRole(["candidate"]);
  if (platformUser.linkedCandidateId) {
    const slug = await getOrCreateCandidateSlug(platformUser.linkedCandidateId, platformUser.name);
    if (slug) {
      redirect(`/${slug}/guidance`);
    }
  }
  redirect("/sign-in");
}
