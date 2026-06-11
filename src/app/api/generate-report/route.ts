import { db } from "@/db";
import { frameworks, frameworkCategories, frameworkCriteria, candidateReports, flCandidates, mandateCandidates } from "@/db/schema";
import { eq, and, ne } from "drizzle-orm";
import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { candidateId, frameworkId, transcript } = await req.json();

    if (!candidateId || !frameworkId || !transcript) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 1. Fetch Framework Data
    const frameworkList = await db.select().from(frameworks).where(eq(frameworks.id, frameworkId));
    if (frameworkList.length === 0) {
      return NextResponse.json({ error: "Framework not found" }, { status: 404 });
    }
    const fw = frameworkList[0];

    const categories = await db.select().from(frameworkCategories).where(eq(frameworkCategories.frameworkId, frameworkId));
    
    // Fetch all criteria for the categories
    const categoriesWithCriteria = await Promise.all(
      categories.map(async (cat) => {
        const criteria = await db.select().from(frameworkCriteria).where(eq(frameworkCriteria.categoryId, cat.id));
        return { ...cat, criteria };
      })
    );

    // 2. Build Dynamic Zod Schema
    const schemaObject: Record<string, z.ZodTypeAny> = {};
    
    // Process string/array sections defined by framework
    const sections = fw.reportSections || [];
    sections.forEach((section) => {
      // Common sections that usually require arrays
      if (section === "Relevant Experience" || section === "Key Strengths" || section === "Areas to Probe" || section === "What is Ayush famous for") {
        schemaObject[section] = z.array(z.string()).describe(`List of bullet points for ${section}`);
      } else {
        schemaObject[section] = z.string().describe(`Detailed paragraph for ${section}`);
      }
    });

    // Add extra metadata fields for final reports if they don't already exist
    const metadataFields = ["Former Company", "Pedigree", "CTC", "Expected CTC", "Revenue Ownership", "Team Size Led", "Notes Summary"];
    metadataFields.forEach(field => {
      if (!schemaObject[field]) {
        if (field === "Notes Summary") {
          schemaObject[field] = z.array(z.string()).describe("A brief 3-4 bullet point summary of overall notes, background, and fit.");
        } else {
          schemaObject[field] = z.string().describe(`Extract or infer ${field} from the transcript. Keep it extremely brief (e.g. 'Kohler India', 'IIM L', 'INR 85L', '400+'). Leave blank if not available.`);
        }
      }
    });

    // Process scoring sections (1-10) based on categories and criteria
    const scoresObject: Record<string, z.ZodTypeAny> = {};
    categoriesWithCriteria.forEach((cat) => {
      const criteriaObject: Record<string, z.ZodTypeAny> = {};
      cat.criteria.forEach((cr) => {
        criteriaObject[cr.name] = z.number().min(1).max(10).describe(`Score from 1 to 10 evaluating ${cr.name}`);
      });
      scoresObject[cat.name] = z.object(criteriaObject);
    });

    schemaObject["scores"] = z.object(scoresObject);
    const DynamicSchema = z.object(schemaObject);

    // 3. Overwrite existing report or create a new one to prevent DB bloat
    const existingReports = await db.select().from(candidateReports).where(eq(candidateReports.candidateId, candidateId));
    let reportId;
    
    if (existingReports.length > 0) {
      reportId = existingReports[0].id;
      await db.update(candidateReports)
        .set({ status: "Generating", frameworkId, reportData: null })
        .where(eq(candidateReports.id, reportId));
        
      // Clean up any stray duplicates
      if (existingReports.length > 1) {
        await db.delete(candidateReports)
          .where(and(eq(candidateReports.candidateId, candidateId), ne(candidateReports.id, reportId)));
      }
    } else {
      reportId = "REP-" + Date.now();
      await db.insert(candidateReports).values({
        id: reportId,
        candidateId,
        frameworkId,
        status: "Generating",
      });
    }

    // We do NOT await the AI generation so the API returns instantly.
    // The generation happens asynchronously.
    generateObject({
      model: google("gemini-2.5-flash"),
      schema: DynamicSchema,
      prompt: `You are an expert executive assessor. Evaluate the following candidate interview transcript and notes against the provided competency framework.
      
TRANSCRIPT / NOTES:
${transcript}

INSTRUCTIONS:
1. Extract relevant information to populate the requested text and bullet-point sections.
2. Evaluate the candidate on the provided criteria and give a score from 1 to 10 for each. Be objective and critical.
3. If information is missing for a specific score, infer reasonably based on the seniority and tone of the transcript, or give a neutral score (e.g. 6-7).
4. IMPORTANT: Keep the output concise and highly focused. For paragraph sections, aim for 1-2 short, impactful sentences. For bullet-point lists, provide exactly 2-3 brief, single-sentence bullet points. Use a professional, senior-executive tone — insightful, sharp, and strictly to the point.`,
    })
      .then(async ({ object }) => {
        // Calculate average score based on weights
        let totalWeightedScore = 0;
        let totalWeight = 0;
        
        categoriesWithCriteria.forEach((cat) => {
          cat.criteria.forEach((cr) => {
            const val = (object.scores as any)?.[cat.name]?.[cr.name] || 0;
            const w = Number(cr.weight) || 10;
            totalWeightedScore += (val * w);
            totalWeight += w;
          });
        });
        
        const overallScore = totalWeight > 0 ? Number((totalWeightedScore / totalWeight).toFixed(1)) : 0;

        // Update report
        await db.update(candidateReports)
          .set({ status: "Completed", reportData: object })
          .where(eq(candidateReports.id, reportId));
          
        // Update candidate score
        const isFlCandidate = await db.select().from(flCandidates).where(eq(flCandidates.id, candidateId));
        if (isFlCandidate.length > 0) {
          // Update Float List record
          await db.update(flCandidates)
            .set({ score: overallScore, assessDate: new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) })
            .where(eq(flCandidates.id, candidateId));
            
          // Update any Mandate Candidate records linked to this Float List ID
          await db.update(mandateCandidates)
            .set({ score: overallScore, hasReport: true })
            .where(eq(mandateCandidates.externalId, candidateId));
        } else {
          // If the candidateId represents a Mandate Candidate directly (fallback)
          const numId = Number(candidateId);
          if (!isNaN(numId)) {
            await db.update(mandateCandidates)
              .set({ score: overallScore, hasReport: true })
              .where(eq(mandateCandidates.id, numId));
          } else {
            await db.update(mandateCandidates)
              .set({ score: overallScore, hasReport: true })
              .where(eq(mandateCandidates.externalId, candidateId));
          }
        }
      })
      .catch(async (error) => {
        console.error("AI Generation failed:", error);
        await db.update(candidateReports)
          .set({ status: "Failed", reportData: { error: error.message } })
          .where(eq(candidateReports.id, reportId));
      });

    return NextResponse.json({ reportId, status: "Generating" });

  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
