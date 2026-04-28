import { generateText } from 'ai';

async function main() {
  try {
    const result = await generateText({
      model: 'openai/gpt-4o-mini',
      prompt: 'Hello'
    });
    console.log("Success:", result.text);
  } catch(e) {
    console.log("Error:", e.message);
  }
}
main();
