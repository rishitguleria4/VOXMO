import { generateText } from "ai";

async function main() {
  try {
    const result = await generateText({
      model: "openai/gpt-4o-mini",
      prompt: "Say hello",
    });
    console.log("OpenAI string success:", result.text);
  } catch (e) {
    console.log("OpenAI string error:", e.message);
  }
}
main();
