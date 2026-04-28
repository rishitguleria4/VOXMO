import { generateText } from "ai";

const modelsToTest = [
  "xai/grok-3",
  "xai/grok-3-mini",
  "mistral/mistral-large-2",
  "mistral/mistral-medium-latest",
  "groq/llama-3.3-70b-versatile",
  "perplexity/sonar-pro",
  "perplexity/sonar-reasoning",
];

async function main() {
  for (const m of modelsToTest) {
    try {
      const result = await generateText({ model: m, prompt: "Say hi in 3 words" });
      console.log(`✅ ${m}: ${result.text.substring(0, 40)}`);
    } catch (e: any) {
      console.log(`❌ ${m}: ${e.message?.substring(0, 80)}`);
    }
  }
}
main();
