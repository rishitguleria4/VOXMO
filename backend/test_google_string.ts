import { generateText } from "ai";

async function main() {
  try {
    const result = await generateText({
      model: "google/gemini-2.5-flash",
      prompt: "Say hello",
    });
    console.log("Google string success:", result.text);
  } catch (e) {
    console.log("Google string error:", e.message);
  }
}
main();
