import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const MODELS_TO_TEST = [
  "gemini-3.5-pro",
  "gemini-3.5-flash",
  "gemini-3.5-flash-lite",
  "gemini-3.1-pro",
  "gemini-3.1-flash",
  "gemini-3.1-flash-lite",
  "gemini-3-pro",
  "gemini-3-flash",
  "gemini-3-flash-lite",
  "gemini-2.5-pro",
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
  "gemini-2.0-pro-exp-02-05",
  "gemini-2.0-flash-exp",
  "gemini-2.0-flash",
  "gemini-2.0-flash-lite-preview-02-05",
  "gemini-2.0-pro",
  "gemini-1.5-pro",
  "gemini-1.5-flash",
  "gemini-1.5-flash-8b",
  "gemini-1.0-pro"
];

const DynamicSchema = z.object({
  "Insights": z.array(z.string()).describe("List 2 insights."),
});

const prompt = `You are an assessor. Extract 2 quick insights from this text: "The candidate is great at sales but needs better management skills."`;

async function testAllModels() {
  console.log("Testing all models for structured JSON (generateObject)...\n");
  const available: string[] = [];
  const rateLimited: string[] = [];
  const notFound: string[] = [];

  for (const model of MODELS_TO_TEST) {
    try {
      process.stdout.write(`Testing ${model}... `);
      await generateObject({
        model: google(model),
        schema: DynamicSchema,
        prompt
      });
      console.log("✅ Success");
      available.push(model);
    } catch (e: any) {
      const msg = e.message || String(e);
      if (msg.includes("not found") || msg.includes("not supported")) {
        console.log("❌ Not Found");
        notFound.push(model);
      } else if (msg.includes("quota") || msg.includes("high demand") || msg.includes("429")) {
        console.log("⚠️ Rate Limited / Quota (But exists)");
        rateLimited.push(model);
      } else {
        console.log(`❌ Failed (${msg})`);
      }
    }
    // slight delay to prevent spamming
    await new Promise(r => setTimeout(r, 1000));
  }

  console.log("\n=========================");
  console.log("✅ WORKING (Ready to use):");
  available.forEach(m => console.log(`- ${m}`));
  
  console.log("\n⚠️ EXISTS BUT RATE LIMITED (Good for fallback):");
  rateLimited.forEach(m => console.log(`- ${m}`));

  console.log("\n❌ NOT FOUND / BLOCKED:");
  notFound.forEach(m => console.log(`- ${m}`));
  console.log("=========================\n");
}

testAllModels().catch(console.error);
