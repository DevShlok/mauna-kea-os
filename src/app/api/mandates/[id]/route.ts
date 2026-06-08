import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/index";
import { mandates, mandateCandidates } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { field, value } = await req.json();
  const resolvedParams = await params;
  const id = Number(resolvedParams.id);
  if (field === "status") {
    await db.update(mandates).set({ status: value }).where(eq(mandates.id, id));
  } else if (field === "internalStatus") {
    await db.update(mandates).set({ internalStatus: value }).where(eq(mandates.id, id));
  }
  return NextResponse.json({ ok: true });
}