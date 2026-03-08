import * as cheerio from 'cheerio';
// Using global fetch (available in Node.js 18+)

interface MedexProduct {
    name: string;
    generic: string;
    brand: string;
    strength: string;
    price: string;
    url: string;
    imageUrl?: string | null;
}

const HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
};

/**
 * Fetches high-quality image from Arogga search API
 */
async function fetchAroggaImage(query: string): Promise<string | null> {
    console.log(`🔍 Searching Arogga for image: ${query}...`);
    try {
        const apiUrl = `https://api.arogga.com/general/v3/search/?_search=${encodeURIComponent(query)}&_type=web&_perPage=1`;
        const response = await fetch(apiUrl, { headers: HEADERS });
        if (!response.ok) return null;

        const result = (await response.json()) as any;
        if (result && result.data && result.data.length > 0) {
            const item = result.data[0];
            const imageUrl = item.p_f_image || (item.attachedFiles_p_images?.[0]?.src) || (item.pv?.[0]?.p_f_image);
            return imageUrl || null;
        }
    } catch (error) {
        console.error('Error fetching image from Arogga:', error);
    }
    return null;
}

/**
 * Scrapes medicine details from a Medex brand page
 */
async function scrapeMedexProduct(url: string): Promise<MedexProduct | null> {
    console.log(`📄 Scraping Medex page: ${url}...`);
    try {
        const response = await fetch(url, { headers: HEADERS });
        if (!response.ok) return null;

        const html = await response.text();
        const $ = cheerio.load(html);

        const pageTitle = $('title').text();
        const titleParts = pageTitle.split('|').map(p => p.trim());

        // Extract from HTML with NEW robust selectors
        const name = $('h1.page-heading-1-l.brand').text().trim() || $('h1.n-title').text().trim() || titleParts[0] || 'Unknown';
        const generic = $('div[title="Generic Name"] a').first().text().trim() || $('div.brand-generics a').first().text().trim() || 'Generic not found';
        const strength = $('div[title="Strength"]').text().trim() || $('span.brand-strength').text().trim() || titleParts[1] || '';
        const brand = $('a.calm-link').first().text().trim() || titleParts.find(p => p.includes('Ltd') || p.includes('Pharm')) || 'Unknown';

        let priceText = $('.package-container > span:nth-child(2)').text().trim() ||
            $('span.unit-price-value').text().trim() ||
            $('.package-container').text().trim();

        // Clean up price
        const priceMatch = priceText.match(/৳\s*([\d.]+)/);
        const price = priceMatch ? priceMatch[0] : 'Price not found';

        return {
            name,
            generic,
            brand,
            strength,
            price,
            url,
        };
    } catch (error) {
        console.error('Error scraping Medex product:', error);
        return null;
    }
}

/**
 * Main function to demonstrate the flow
 */
async function runSample() {
    const sampleUrls = [
        'https://medex.com.bd/brands/14264/a-cal-500-mg-tablet',
        'https://medex.com.bd/brands/501/napa-500-mg-tablet',
        'https://medex.com.bd/brands/11995/sergel-20-mg-capsule'
    ];

    console.log('🚀 Starting Medex Scraper Sample...\n');

    for (const url of sampleUrls) {
        const product = await scrapeMedexProduct(url);
        if (product) {
            // Step 2: Try to get image from Arogga
            const searchQuery = `${product.name} ${product.strength}`;
            product.imageUrl = await fetchAroggaImage(searchQuery);

            console.log('--- Result ---');
            console.log(`💊 Name: ${product.name}`);
            console.log(`🧪 Generic: ${product.generic}`);
            console.log(`🏭 Brand: ${product.brand}`);
            console.log(`💪 Strength: ${product.strength}`);
            console.log(`💰 Price: ${product.price}`);
            console.log(`🖼️ Image Source: ${product.imageUrl ? 'Arogga' : 'Not found'}`);
            if (product.imageUrl) console.log(`🔗 Image URL: ${product.imageUrl}`);
            console.log('--------------\n');
        }
        // Delay to be polite
        await new Promise(r => setTimeout(r, 1000));
    }
}

runSample();
