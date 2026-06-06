import * as cheerio from 'cheerio';
import * as fs from 'fs';

async function main() {
  const url = 'https://chaldal.com/nestle-coffee-mate-coffee-creamer-box-450-gm';
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    },
  })
  const html = await response.text()
  
  const stateMatch = html.match(/window\.__reactAsyncStatePacket\s*=\s*(\{[\s\S]*?\})\s*<\/script>/)
  if (stateMatch) {
    fs.writeFileSync('chaldal-state.json', stateMatch[1]);
    console.log("State written to chaldal-state.json");
  }
}

main().catch(console.error);
