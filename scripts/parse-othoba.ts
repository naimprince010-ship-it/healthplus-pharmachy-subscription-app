import * as cheerio from 'cheerio';
import * as fs from 'fs';

function testOthobaScraper() {
    const html = fs.readFileSync('othoba_sample.html', 'utf8');
    const $ = cheerio.load(html);

    const products: any[] = [];

    $('.product-wrapper .product').each((i, el) => {
        const parentCtx = $(el).parent();

        // Sometimes the link is in h4.product-name a
        const nameLink = $(el).find('.product-name a');
        const name = nameLink.text().trim();
        const relativeUrl = nameLink.attr('href');
        const fullUrl = relativeUrl ? `https://www.othoba.com${relativeUrl}` : null;

        // Price usually in .new-price or .product-price
        let priceText = $(el).find('.actual-price, .new-price').text().trim();
        if (!priceText) {
            priceText = $(el).find('.product-price').first().text().trim();
        }
        const priceMatch = priceText.match(/(?:Tk|৳|BDT)\s*([\d,.]+)/i) || priceText.match(/([\d,.]+)/);
        const price = priceMatch ? parseFloat(priceMatch[1].replace(/,/g, '')) : null;

        // Image
        let imageUrl = $(el).find('img').first().attr('data-src') || $(el).find('img').first().attr('src');

        if (name && name.length > 0) {
            products.push({ name, url: fullUrl, price, imageUrl });
        }
    });

    console.log(`Found ${products.length} products`);
    if (products.length > 0) {
        console.log(products.slice(0, 3));
    }
}

testOthobaScraper();
