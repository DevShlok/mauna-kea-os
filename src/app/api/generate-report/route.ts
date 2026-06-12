import { db } from "@/db";
import { frameworks, frameworkCategories, frameworkCriteria, candidateReports, candidates, mandateCandidates } from "@/db/schema";
import { eq, and, ne } from "drizzle-orm";
import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { candidateId, frameworkId, mandateId, transcript, feedback } = await req.json();

    if (!candidateId || !frameworkId || !transcript) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 0. Fetch Mandate and Candidate details for extended AI context
    let enrichedContext = "";
    
    // Fetch Candidate
    const candidateData = await db.select().from(candidates).where(eq(candidates.id, candidateId));
    if (candidateData.length > 0) {
      const cand = candidateData[0];
      if (cand.dreamRoles?.length || cand.dreamCos?.length) {
        enrichedContext += `\nCANDIDATE CAREER ASPIRATIONS (From Profile):\nDream Roles: ${cand.dreamRoles?.join(", ")}\nDream Companies: ${cand.dreamCos?.join(", ")}\n`;
      }
    } else {
      // Fallback check if candidateId is a MandateCandidate ID
      const numId = Number(candidateId);
      if (!isNaN(numId)) {
        const mc = await db.select().from(mandateCandidates).where(eq(mandateCandidates.id, numId));
        if (mc.length > 0 && mc[0].externalId) {
          const flc = await db.select().from(candidates).where(eq(candidates.id, mc[0].externalId));
          if (flc.length > 0) {
            const cand = flc[0];
            if (cand.dreamRoles?.length || cand.dreamCos?.length) {
              enrichedContext += `\nCANDIDATE CAREER ASPIRATIONS (From Profile):\nDream Roles: ${cand.dreamRoles?.join(", ")}\nDream Companies: ${cand.dreamCos?.join(", ")}\n`;
            }
          }
        }
      }
    }

    // Fetch Mandate
    if (mandateId) {
      // Since mandate is imported from schema, wait, `mandates` is imported
      const { mandates } = await import("@/db/schema");
      const mandateList = await db.select().from(mandates).where(eq(mandates.id, Number(mandateId)));
      if (mandateList.length > 0) {
        const m = mandateList[0];
        enrichedContext += `\nMANDATE SEARCH CONTEXT (Role Requirements):\n`;
        enrichedContext += `Target Sectors: ${m.sectors?.join(", ") || "N/A"}\n`;
        enrichedContext += `Target Companies: ${m.targetCompanies?.join(", ") || "N/A"}\n`;
        if (m.diversity) enrichedContext += `Diversity Preference: ${m.diversity}\n`;
        if (m.jdText) enrichedContext += `\nJOB DESCRIPTION (Extracted):\n${m.jdText}\n`;
        if (m.interviewNotesText) enrichedContext += `\nCLIENT INTERVIEW NOTES:\n${m.interviewNotesText}\n`;
        if (m.additionalDocsText) enrichedContext += `\nADDITIONAL CONTEXT DOCS:\n${m.additionalDocsText}\n`;
        if (m.searchNotes) enrichedContext += `\nCONSULTANT SEARCH NOTES:\n${m.searchNotes}\n`;
        if (m.openQuestions) enrichedContext += `\nOPEN QUESTIONS FOR CLIENT:\n${m.openQuestions}\n`;
      }
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
    const metadataFields = ["Former Company", "Pedigree", "CTC", "Expected CTC", "Revenue Ownership", "Team Size Led", "Notes Summary", "Superior Feedback", "Peer Feedback", "Team/Subordinate Feedback", "Interviewer Feedback", "Career Aspiration"];
    metadataFields.forEach(field => {
      if (!schemaObject[field]) {
        if (field === "Notes Summary") {
          schemaObject[field] = z.array(z.string()).describe("A brief 3-4 bullet point summary of overall notes, background, and fit.");
        } else if (field === "Interviewer Feedback") {
          schemaObject[field] = z.string().describe("Extract and summarize the core Interviewer Feedback directly from the general Interview Notes provided. Keep it to 1-2 impactful sentences. Return an empty string if it is not provided or missing.");
        } else if (field.includes("Feedback")) {
          schemaObject[field] = z.string().describe(`Summarize the ${field} using professional executive language based on the provided explicit notes for it. Keep it to 1-2 impactful sentences. Return an empty string if it is not provided or missing.`);
        } else if (field === "Career Aspiration") {
          schemaObject[field] = z.string().describe(`Summarize the candidate's Career Aspirations strictly based on their stated Dream Roles and Dream Companies in the context. Write 1-2 sharp sentences.`);
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

    // Calculate Normalized Weights for the AI Prompt
    const numCategories = categoriesWithCriteria.length;
    let frameworkContext = "\nCOMPETENCY FRAMEWORK (Normalized Weightings):\n";
    frameworkContext += "The candidate is evaluated across categories. Each category holds equal weight globally, but the criteria inside them have specific weights.\n";
    categoriesWithCriteria.forEach((cat) => {
      const categoryGlobalWeight = 100 / (numCategories || 1);
      frameworkContext += `- Category: ${cat.name} (Global Category Weight: ${categoryGlobalWeight.toFixed(1)}%)\n`;
      cat.criteria.forEach((cr) => {
        const localWeight = Number(cr.weight) || 0;
        const globalWeight = (localWeight / 100) * categoryGlobalWeight;
        frameworkContext += `   * Criterion: ${cr.name}\n     -> Local Weight: ${localWeight}% | **Normalized Global Weight: ${globalWeight.toFixed(1)}%**\n`;
      });
    });
    enrichedContext += frameworkContext;

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

    generateObject({
      model: google("gemini-2.5-flash"),
      schema: DynamicSchema,
      prompt: `You are an expert executive assessor and organizational psychologist. Your objective is to evaluate the following candidate interview transcript and notes against the provided competency framework, taking into account the specific role requirements (Mandate Data).
      
${enrichedContext}

TRANSCRIPT / CANDIDATE NOTES:
${transcript}

EVALUATION PIPELINE INSTRUCTIONS:
1. ASSESS THE ROLE (MANDATE): First, understand the Target Sectors, Job Description, and Consultant Search Notes. This is the baseline of what the client strictly needs.
2. APPLY NORMALIZED WEIGHTS: Look closely at the "Normalized Global Weight" for each criterion in the Competency Framework.
   - High Global Weight (>10%): These are make-or-break criteria. Be highly critical and look for explicit, undeniable evidence in the transcript.
   - Lower Global Weight (<5%): These are secondary criteria. You may infer reasonably based on the candidate's seniority and overall pedigree.
3. SCORING (1-10): Evaluate the candidate objectively. 
   - 1-4: Significant gaps or red flags.
   - 5-6: Meets basic expectations but lacks distinction.
   - 7-8: Strong, proven capability with clear examples.
   - 9-10: Exceptional, industry-leading expertise with quantifiable impact.
4. EXTRACT INSIGHTS (EXTREME BREVITY REQUIRED):
   - For paragraph sections: Write exactly 1 short, impactful sentence. Maximum 15-20 words.
   - For bullet-point lists: Provide exactly 2 brief bullet points. Maximum 10-15 words per point. Do NOT write paragraphs as bullets.
   - Eliminate all fluff, filler, and introductory phrasing. Get straight to the core facts.
5. TONE: Use a professional, senior-executive tone — telegraphic, highly analytical, and strictly to the point. Less is more.`,
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
        const isFlCandidate = await db.select().from(candidates).where(eq(candidates.id, candidateId));
        if (isFlCandidate.length > 0) {
          // Update Float List record
          await db.update(candidates)
            .set({ score: overallScore, assessDate: new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) })
            .where(eq(candidates.id, candidateId));
            
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
