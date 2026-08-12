"use server";

import { db } from "@/db";
import { candidates } from "@/db/schema";
import { and, eq, gte, lte, ne, sql, ilike } from "drizzle-orm";

export interface BenchmarkParams {
  candId?: string;
  designation?: string;
  expMin?: number;
  expMax?: number;
  location?: string;
}

export interface BenchmarkResult {
  success: boolean;
  insufficient?: boolean;
  sampleSize: number;
  candidateCtc?: number;
  p25?: number;
  p50?: number;
  p75?: number;
  percentile?: number;
  error?: string;
}

export async function getBenchmarkAction(params: BenchmarkParams): Promise<BenchmarkResult> {
  try {
    const { candId, designation, expMin, expMax, location } = params;

    let cand: any = null;
    if (candId) {
      const [found] = await db.select().from(candidates).where(eq(candidates.id, candId));
      cand = found;
    }

    const candidateCtc = cand?.ctc || cand?.fixedCtc || null;

    const conditions = [
      eq(candidates.isDeleted, false),
      sql`${candidates.ctc} > 0 OR ${candidates.fixedCtc} > 0`,
    ];

    if (candId) {
      conditions.push(ne(candidates.id, candId));
    }

    if (expMin !== undefined && expMin !== null && !isNaN(expMin)) {
      conditions.push(gte(candidates.exp, expMin));
    }
    if (expMax !== undefined && expMax !== null && !isNaN(expMax)) {
      conditions.push(lte(candidates.exp, expMax));
    }

    if (designation && designation.trim() !== "") {
      conditions.push(ilike(candidates.designation, `%${designation.trim()}%`));
    }

    if (location && location.trim() !== "") {
      conditions.push(ilike(candidates.location, `%${location.trim()}%`));
    }

    const rows = await db
      .select({ ctc: candidates.ctc, fixedCtc: candidates.fixedCtc })
      .from(candidates)
      .where(and(...conditions));

    const salaryList = rows
      .map((r) => r.ctc || r.fixedCtc || 0)
      .filter((s) => s > 0)
      .sort((a, b) => a - b);

    if (salaryList.length < 3) {
      return {
        success: true,
        insufficient: true,
        sampleSize: salaryList.length,
        candidateCtc: candidateCtc || undefined,
      };
    }

    const getPercentileValue = (arr: number[], q: number) => {
      const pos = (arr.length - 1) * q;
      const base = Math.floor(pos);
      const rest = pos - base;
      if (arr[base + 1] !== undefined) {
        return arr[base] + rest * (arr[base + 1] - arr[base]);
      } else {
        return arr[base];
      }
    };

    const p25 = Math.round(getPercentileValue(salaryList, 0.25) * 10) / 10;
    const p50 = Math.round(getPercentileValue(salaryList, 0.50) * 10) / 10;
    const p75 = Math.round(getPercentileValue(salaryList, 0.75) * 10) / 10;

    let percentile = 50;
    if (candidateCtc && candidateCtc > 0) {
      const lowerCount = salaryList.filter((s) => s <= candidateCtc).length;
      percentile = Math.min(99, Math.max(1, Math.round((lowerCount / salaryList.length) * 100)));
    }

    return {
      success: true,
      insufficient: false,
      sampleSize: salaryList.length,
      candidateCtc: candidateCtc || undefined,
      p25,
      p50,
      p75,
      percentile,
    };
  } catch (err: any) {
    console.error("Failed to compute benchmark:", err);
    return { success: false, sampleSize: 0, error: err.message || "Failed to calculate benchmark" };
  }
}
