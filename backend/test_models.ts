import { generateText } from "ai";

const modelsToTest = [
  "mistral/mistral-large-latest",
  "mistral/mistral-small-latest",
  "groq/llama3-8b-8192",
  "groq/llama-3.1-8b-instant",
  "perplexity/llama-3-sonar-large-32k-online",
  "perplexity/sonar",
  "xai/grok-beta",
  "xai/grok-2",
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
