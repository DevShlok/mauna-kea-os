import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

async function testGeminiPro() {
  console.log("Testing gemini-1.5-pro for structured JSON generation...\n");

  const DynamicSchema = z.object({
    "Notes Summary": z.array(z.string()).describe("A brief list of 3-5 bullet points summarizing the candidate's background, fit, and overall notes."),
    "Key Strengths": z.array(z.string()).describe("List 3-5 key strengths of the candidate."),
    "Recommendation": z.string().describe("Provide a final recommendation paragraph for the candidate."),
    "scores": z.object({
      "Communication": z.object({
        "Clarity": z.number().min(0).max(10).describe("Score from 0 to 10 evaluating Clarity"),
      })
    })
  });

  const prompt = `You are an expert executive assessor. Evaluate the candidate based on the following notes.
  
TRANSCRIPT / CANDIDATE NOTES:
The candidate has 15 years of experience in enterprise software sales. They previously worked at Oracle and Salesforce, achieving 150% of their quota for the last 3 years consecutively. They are highly articulate and presented a very clear go-to-market strategy during the interview. The only slight concern is that they have less experience managing extremely large teams (their largest team was 5 people). They are looking for a VP of Sales role.

EVALUATION PIPELINE INSTRUCTIONS:
1. SCORING (1-10): Evaluate the candidate objectively.
2. EXTRACT INSIGHTS: Keep it extremely brief and professional.`;

  try {
    const { object } = await generateObject({
      model: google("gemini-1.5-pro"),
      schema: DynamicSchema,
      prompt
    });

    console.log("✅ Success! gemini-1.5-pro is working perfectly for your use case.\n");
    console.log("Generated JSON Output:");
    console.log(JSON.stringify(object, null, 2));

  } catch (error: any) {
    console.error("❌ Failed to generate with gemini-1.5-pro.");
    console.error("Error Message:", error.message || error);
  }
}

testGeminiPro().catch(console.error);
