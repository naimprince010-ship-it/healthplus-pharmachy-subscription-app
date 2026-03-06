const { chromium } = require('playwright');

async function testOthobaScraper() {
    console.log('Starting Playwright...');
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    try {
        console.log('Navigating to Othoba...');
        await page.goto('https://www.othoba.com/cheese-3', { waitUntil: 'networkidle' });

        // Wait for at least one price to appear to ensure JS has hydrated the page
        console.log('Waiting for prices to load...');
        await page.waitForSelector('.new-price, .actual-price', { timeout: 10000 }).catch(() => console.log('Timeout waiting for price'));

        const products = await page.evaluate(() => {
            const items = [];
            const productElements = document.querySelectorAll('.product-wrapper .product');

            productElements.forEach((el) => {
                // Name and URL
                const nameLink = el.querySelector('.product-name a');
                const name = nameLink ? nameLink.innerText.trim() : '';
                const href = nameLink ? nameLink.getAttribute('href') : '';
                const url = href ? `https://www.othoba.com${href}` : null;

                // Price
                let priceText = '';
                const newPriceEl = el.querySelector('.new-price, .actual-price');
                if (newPriceEl && newPriceEl.innerText.trim()) {
                    priceText = newPriceEl.innerText.trim();
                } else {
                    const prodPriceEl = el.querySelector('.product-price');
                    if (prodPriceEl) priceText = prodPriceEl.innerText.trim();
                }

                const priceMatch = priceText.match(/(?:Tk|৳|BDT)\s*([\d,.]+)/i) || priceText.match(/([\d,.]+)/);
                const price = priceMatch && priceMatch[1] ? parseFloat(priceMatch[1].replace(/,/g, '')) : null;

                // Image
                const imgEl = el.querySelector('img');
                let imageUrl = null;
                if (imgEl) {
                    imageUrl = imgEl.getAttribute('src') || imgEl.getAttribute('data-src');
                }

                if (name) {
                    items.push({ name, url, price, imageUrl });
                }
            });

            return items;
        });

        console.log(`Found ${products.length} products with Playwright`);
        if (products.length > 0) {
            console.log(products.slice(0, 3));
        }
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await browser.close();
    }
}

testOthobaScraper();
