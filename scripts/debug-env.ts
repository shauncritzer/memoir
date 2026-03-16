/**
 * Debug Environment Variables
 * Check what LLM provider is actually being used
 */

import { config } from "dotenv";
config();

console.log("🔍 Environment Variable Debug\n");

const keys = [
  "BUILT_IN_FORGE_API_KEY",
  "ANTHROPIC_API_KEY",
  "GOOGLE_API_KEY",
  "OPENAI_API_KEY",
];

for (const key of keys) {
  const value = process.env[key];
  if (value) {
    console.log(`✅ ${key}: ${value.substring(0, 15)}... (${value.length} chars)`);
  } else {
    console.log(`❌ ${key}: NOT SET`);
  }
}

console.log("\n📊 LLM Provider Resolution:\n");

// Simulate the provider resolution logic
import { ENV } from "../server/_core/env";

if (ENV.forgeApiKey) {
  console.log("🎯 SELECTED: Forge");
  console.log(`   Key: ${ENV.forgeApiKey.substring(0, 15)}...`);
} else if (ENV.anthropicApiKey) {
  console.log("🎯 SELECTED: Anthropic Claude");
  console.log(`   Key: ${ENV.anthropicApiKey.substring(0, 15)}...`);
} else if (ENV.googleApiKey) {
  console.log("🎯 SELECTED: Google Gemini (free tier)");
  console.log(`   Key: ${ENV.googleApiKey.substring(0, 15)}...`);
} else if (ENV.openaiApiKey) {
  console.log("🎯 SELECTED: OpenAI");
  console.log(`   Key: ${ENV.openaiApiKey.substring(0, 15)}...`);
} else {
  console.log("❌ NO PROVIDER CONFIGURED");
}

console.log("\n🔍 ENV object inspection:");
console.log(`   ENV.anthropicApiKey: ${ENV.anthropicApiKey ? `"${ENV.anthropicApiKey.substring(0, 15)}..." (${ENV.anthropicApiKey.length} chars)` : "EMPTY OR UNDEFINED"}`);
console.log(`   ENV.googleApiKey: ${ENV.googleApiKey ? `"${ENV.googleApiKey.substring(0, 15)}..." (${ENV.googleApiKey.length} chars)` : "EMPTY OR UNDEFINED"}`);
