import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = path.join(__dirname, '..', 'playwright-temp', 'azan_products.json');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('=== AZAN WHOLESALE SCRAPER ===');
  console.log(`Output will be saved to: ${OUTPUT_PATH}`);
  console.log('Logging in...');

  await page.goto('https://azanwholesale.com/login');
  await page.waitForTimeout(2000);

  await page.fill('input[aria-label="Enter Your Phone"]', '01938264923');
  await page.fill('input[aria-label="Enter Your Password"]', 'Naim18005@');

  const buttons = await page.$$('button');
  for (const btn of buttons) {
    const text = await btn.textContent();
    if (text && /sign in|login/i.test(text)) {
      await btn.click();
      console.log('Login button clicked.');
      break;
    }
  }

  await page.waitForTimeout(8000);
  console.log('Navigating to products page...');
  await page.goto('https://azanwholesale.com/dashboard/products/addproducts');
  await page.waitForTimeout(5000);

  // Scroll to load all products (infinite scroll support)
  console.log('Scrolling to load all products...');
  let previousHeight = 0;
  let scrollAttempts = 0;
  const maxScrollAttempts = 20;

  while (scrollAttempts < maxScrollAttempts) {
    const currentHeight = await page.evaluate(() => document.body.scrollHeight);
    if (currentHeight === previousHeight) {
      scrollAttempts++;
      if (scrollAttempts >= 3) {
        console.log(`No more content loading after ${scrollAttempts} attempts. Stopping scroll.`);
        break;
      }
    } else {
      scrollAttempts = 0;
    }
    previousHeight = currentHeight;
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(2000);
    
    const count = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('div')).filter(div => {
        const h3 = div.querySelector('h3');
        const h4 = div.querySelector('h4');
        return h3 && (h4 || div.textContent.includes('৳'));
      });
      return new Set(cards.map(c => c.querySelector('h3')?.textContent?.trim()).filter(Boolean)).size;
    });
    process.stdout.write(`\r  Products found so far: ${count}   `);
  }
  console.log('\nDone scrolling.');

  // Extract all products
  const products = await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('div')).filter(div => {
      const h3 = div.querySelector('h3');
      const h4 = div.querySelector('h4');
      return h3 && (h4 || div.textContent.includes('৳'));
    });

    return cards.map(card => {
      const name = card.querySelector('h3')?.textContent?.trim() || '';

      // Price
      let priceText = card.querySelector('h4')?.textContent?.trim() || '';
      if (!priceText) {
        const match = card.textContent.match(/৳\s*(\d+[,.\d]*)/);
        if (match) priceText = match[1];
      }
      const rawPrice = priceText.replace(/[৳,]/g, '').trim();

      // SKU
      const spans = Array.from(card.querySelectorAll('span'));
      const skuSpan = spans.find(s => /^\d{10,}$/.test(s.textContent.trim()));
      const sku = skuSpan ? skuSpan.textContent.trim() : '';

      // Image - skip placeholder/logo images
      const img = card.querySelector('img');
      let imageUrl = '';
      if (img) {
        let src = img.getAttribute('srcset') || img.getAttribute('src') || '';
        if (src.includes('url=')) {
          const parts = src.split('url=');
          if (parts[1]) imageUrl = decodeURIComponent(parts[1].split('&')[0]);
        } else {
          imageUrl = src.split(' ')[0];
        }
        // Filter out logo/placeholder images (relative paths or known logo paths)
        if (!imageUrl.startsWith('http') || imageUrl.includes('Logo.') || imageUrl.includes('logo.') || imageUrl.includes('placeholder')) {
          imageUrl = '';
        }
      }

      // Stock
      const qtyLeftSpan = spans.find(s => s.textContent.includes('Qty Left'));
      let stock = 0;
      if (qtyLeftSpan) {
        const prev = qtyLeftSpan.previousElementSibling;
        if (prev) {
          stock = parseInt(prev.textContent.trim()) || 0;
        } else {
          const parent = qtyLeftSpan.parentElement;
          const siblings = Array.from(parent.querySelectorAll('span'));
          const idx = siblings.indexOf(qtyLeftSpan);
          if (idx > 0) stock = parseInt(siblings[idx - 1].textContent.trim()) || 0;
        }
      }

      return { name, supplierPrice: parseFloat(rawPrice), sku, imageUrl, stock };
    }).filter(p => p.name && p.supplierPrice && !isNaN(p.supplierPrice));
  });

  // Deduplicate
  const uniqueProducts = [];
  const names = new Set();
  for (const p of products) {
    if (p.name && !names.has(p.name)) {
      names.add(p.name);
      uniqueProducts.push(p);
    }
  }

  // Stats
  const withImages = uniqueProducts.filter(p => p.imageUrl).length;
  const withoutImages = uniqueProducts.filter(p => !p.imageUrl).length;
  const inStock = uniqueProducts.filter(p => p.stock > 0).length;
  const outOfStock = uniqueProducts.filter(p => p.stock === 0).length;

  console.log('\n=== SCRAPE RESULTS ===');
  console.log(`Total products found: ${uniqueProducts.length}`);
  console.log(`With images: ${withImages} | Without images: ${withoutImages}`);
  console.log(`In stock: ${inStock} | Out of stock: ${outOfStock}`);
  console.log('\nPrice preview (supplier → selling at 60% markup):');
  uniqueProducts.slice(0, 5).forEach(p => {
    const selling = Math.ceil(p.supplierPrice * 1.6);
    console.log(`  ${p.name.substring(0, 50).padEnd(50)} | Supplier: ৳${p.supplierPrice} → Sell: ৳${selling}`);
  });
  if (uniqueProducts.length > 5) console.log(`  ... and ${uniqueProducts.length - 5} more`);

  if (uniqueProducts.length > 0) {
    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(uniqueProducts, null, 2));
    console.log(`\nSaved to: ${OUTPUT_PATH}`);
  } else {
    console.log('\nNo products found! Check if login succeeded.');
  }

  await browser.close();
})();
