/**
 * lib/server-session.ts
 *
 * Shared server-side session helpers used across multiple action files.
 * Previously duplicated verbatim in actions/index.ts and actions/candidates.ts.
 */
"use server";

import { db } from "@/db";
import { platformUsers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createClient } from "@/utils/supabase/server";

/**
 * Returns the display name of the currently authenticated platform user.
 * Falls back to email if no DB record exists, or "Unknown" on any error.
 * Never throws — safe to call from any server action.
 */
export async function getCurrentUserName(): Promise<string> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.email) {
      const [dbUser] = await db
        .select({ name: platformUsers.name })
        .from(platformUsers)
        .where(eq(platformUsers.email, user.email))
        .limit(1);
      if (dbUser) return dbUser.name;
      return user.email;
    }
  } catch (e) {
    console.error("[getCurrentUserName] failed:", e);
  }
  return "Unknown";
}
