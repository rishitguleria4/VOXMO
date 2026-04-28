import { streamText } from 'ai';
import { generateText } from 'ai';

async function main() {
  try {
    const result = await generateText({
      model: 'google/gemini-1.5-flash',
      prompt: 'Hello from Google'
    });
    console.log(result.text);
  } catch(e) {
    console.log(e.message);
  }
}
main();
