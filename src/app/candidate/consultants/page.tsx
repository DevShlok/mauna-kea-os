import { requireRole } from "@/lib/auth";
import { getOrCreateCandidateSlug } from "@/lib/slug";
import { redirect } from "next/navigation";

export default async function CandidateConsultantsRedirect() {
  const { platformUser } = await requireRole(["candidate"]);
  if (platformUser.linkedCandidateId) {
    const slug = await getOrCreateCandidateSlug(platformUser.linkedCandidateId, platformUser.name);
    if (slug) {
      redirect(`/${slug}/consultants`);
    }
  }
  redirect("/sign-in");
}
