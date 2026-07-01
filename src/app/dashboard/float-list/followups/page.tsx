import { requireRole } from "@/lib/auth";
import { getFollowUps } from "@/db/queries";
import FollowUpsClient from "@/features/float-list/components/FollowUpsClient";

export default async function FollowUpsPage() {
  await requireRole(["admin", "consultant"]);

  const followUps = await getFollowUps();
  return <FollowUpsClient initialFollowUps={followUps} />;
}