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
  
  $('*').each((_, el) => {
    const text = $(el).clone().children().remove().end().text().trim();
    if (text.includes('৳') && text.includes('380')) {
      const tagName = 'name' in el ? el.name : 'unknown';
      console.log('Found price in tag:', tagName, 'class:', $(el).attr('class'));
    }
  });
}

main().catch(console.error);
