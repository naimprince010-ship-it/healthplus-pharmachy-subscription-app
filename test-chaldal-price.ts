import { importProductFromUrl } from './lib/importers/product-import';
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
  
  const priceText = $('body').text()
  const priceMatches = priceText.match(/৳\s*([\d,.]+)/g) || []
  console.log("All price matches on body:", priceMatches);
}

main().catch(console.error);
