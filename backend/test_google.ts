import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText } from "ai";

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});

async function main() {
  try {
    const result = await generateText({
      model: google("gemini-1.5-flash-latest"),
      prompt: "Hello"
    });
    console.log("Success:", result.text);
  } catch (e) {
    console.log("Error:", e.message);
  }
}
main();
