import { getFollowUps } from "@/db/queries";
import FollowUpsClient from "./FollowUpsClient";

export default async function FollowUpsPage() {
  const followUps = await getFollowUps();
  return <FollowUpsClient initialFollowUps={followUps} />;
}