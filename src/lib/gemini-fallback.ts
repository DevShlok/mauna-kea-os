import { generateObject } from "ai";
import { google } from "@ai-sdk/google";

// Ordered list of models to try, from best/newest to oldest fallbacks
const FALLBACK_MODELS = [
  // 1. Pro Tier (Best reasoning, often rate-limited on free tier)
  "gemini-2.5-pro",
  
  // 2. Flash Tier (Great balance of speed and reasoning)
  "gemini-3.5-flash",
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  
  // 3. Flash Lite Tier (Extremely fast, reliable fallbacks)
  "gemini-3.1-flash-lite",
  "gemini-2.5-flash-lite"
];

export async function generateObjectWithFallback(options: any) {
  let lastError: any = null;

  for (const modelName of FALLBACK_MODELS) {
    try {
      console.log(`[AI] Attempting generation with model: ${modelName}`);
      // The options object contains schema, prompt, etc. We just inject the model.
      const result = await generateObject({
        ...options,
        model: google(modelName),
        maxRetries: 0 // Disable internal retries so we immediately fallback on rate limit
      });
      console.log(`[AI] Success with model: ${modelName}`);
      return result;
    } catch (error: any) {
      console.warn(`[AI] Generation failed with model ${modelName}: ${error?.message || "Unknown error"}`);
      lastError = error;
      // Continue to the next model in the array
    }
  }

  throw new Error(`All fallback models failed. Last error: ${lastError?.message || lastError}`);
}
