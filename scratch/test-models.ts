import { generateText } from "ai";
import { google } from "@ai-sdk/google";
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

async function testModels() {
  console.log("Starting model test...\n");
  const workingModels: string[] = [];
  const unavailableModels: string[] = [];

  for (const model of MODELS_TO_TEST) {
    try {
      process.stdout.write(`Testing ${model}... `);
      await generateText({
        model: google(model),
        prompt: "Say 'yes' and nothing else.",
        maxTokens: 5,
      });
      console.log("✅ Available");
      workingModels.push(model);
    } catch (e: any) {
      console.log(`❌ Failed (${e.message || e})`);
      unavailableModels.push(model);
    }
  }

  console.log("\n=========================");
  console.log("WORKING MODELS:");
  workingModels.forEach(m => console.log(`- ${m}`));
  console.log("=========================\n");
}

testModels().catch(console.error);
