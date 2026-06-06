import * as cheerio from 'cheerio';

async function main() {
  const url = 'https://chaldal.com/nestle-coffee-mate-coffee-creamer-box-450-gm';
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    },
  })
  const html = await response.text()
  const $ = cheerio.load(html)
  
  $('script[type="application/ld+json"]').each((_, el) => {
    console.log("JSON-LD found:", $(el).html());
  });
}

main().catch(console.error);
