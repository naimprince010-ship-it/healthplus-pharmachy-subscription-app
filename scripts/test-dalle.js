import OpenAI from 'openai';

async function run() {
  const apiKey = process.env.OPENAI_API_KEY;
  const openai = new OpenAI({ apiKey });

  try {
    const res = await openai.images.generate({
      model: 'dall-e-3',
      prompt: 'A premium skincare flatlay',
      size: '1024x1024',
      quality: 'standard',
      n: 1,
    });
    console.log("Success with dall-e-3:", res.data[0].url ? "URL generated" : "b64 generated");
  } catch (err) {
    console.error("Error with dall-e-3:", err.message);
  }
}

run().catch(console.error);
