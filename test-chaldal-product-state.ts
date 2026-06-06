import * as cheerio from 'cheerio';

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
    const state = JSON.parse(stateMatch[1]);
    const blocks = Object.values(state).filter(b => b && typeof b === 'object');
    for (const block of blocks as any[]) {
      if ('productDetailDto' in block) {
        console.log("productDetailDto key is present. Its value:", JSON.stringify(block.productDetailDto, null, 2));
      }
    }
  }
}

main().catch(console.error);
