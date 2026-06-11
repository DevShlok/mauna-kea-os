import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/index";
import { mandateCandidates } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { stage } = await req.json();
  const resolvedParams = await params;
  const id = Number(resolvedParams.id);
  await db.update(mandateCandidates).set({ stage }).where(eq(mandateCandidates.id, id));
  
  revalidatePath("/dashboard/candidates");
  revalidatePath("/dashboard/mandates/[id]", "page");
  
  return NextResponse.json({ ok: true });
}