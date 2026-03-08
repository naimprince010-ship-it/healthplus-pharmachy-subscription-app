import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

const HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
};

async function fetchAroggaImage(query: string): Promise<string | null> {
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

export async function POST(req: Request) {
    try {
        const { url, mode = 'single' } = await req.json();

        if (!url || !url.includes('medex.com.bd')) {
            return NextResponse.json({ error: 'Invalid Medex URL' }, { status: 400 });
        }

        const response = await fetch(url, { headers: HEADERS });
        if (!response.ok) {
            return NextResponse.json({ error: 'Failed to fetch Medex page' }, { status: response.status });
        }

        const html = await response.text();
        const $ = cheerio.load(html);

        const pageTitle = $('title').text();
        const titleParts = pageTitle.split('|').map(p => p.trim());

        // Mode: Expand (Get all brand links from a list page)
        if (mode === 'expand') {
            const links: { name: string; url: string }[] = [];

            // Selector for Brand Items (Generic pages, etc.)
            $('a.brand-item, a.hoverable-block').each((i, el) => {
                const href = $(el).attr('href');
                const name = $(el).find('.brand-name').text().trim() || $(el).text().trim();

                if (href && href.includes('/brands/')) {
                    const fullUrl = href.startsWith('http') ? href : `https://medex.com.bd${href}`;
                    // Avoid duplicates
                    if (!links.find(l => l.url === fullUrl)) {
                        links.push({ name, url: fullUrl });
                    }
                }
            });

            return NextResponse.json({ links });
        }

        // Mode: Single (Standard detail extraction)
        // Check if it's a detail page
        if (!url.includes('/brands/')) {
            return NextResponse.json({
                error: 'Please provide a specific brand URL (e.g., medex.com.bd/brands/...) or use "expand" mode for list pages.'
            }, { status: 400 });
        }

        // Extract from HTML with NEW robust selectors (Medex updated their site)
        const name = $('h1.page-heading-1-l.brand').text().trim() || $('h1.n-title').text().trim() || titleParts[0] || 'Unknown';
        const generic = $('div[title="Generic Name"] a').first().text().trim() || $('div.brand-generics a').first().text().trim() || 'Generic not found';
        const strength = $('div[title="Strength"]').text().trim() || $('span.brand-strength').text().trim() || titleParts[1] || '';
        const brand = $('a.calm-link').first().text().trim() || titleParts.find(p => p.includes('Ltd') || p.includes('Pharm')) || 'Unknown';
        const dosageForm = $('h1.page-heading-1-l small.h1-subtitle').text().trim() || $('h1.n-title + span').text().trim() || '';

        // Therapeutic Class extraction
        let therapeuticClass = '';
        $('h4.ac-header').each((i, el) => {
            if ($(el).text().includes('Therapeutic Class')) {
                therapeuticClass = $(el).next('.ac-body').text().trim();
            }
        });

        // Price extraction: often in .package-container > span
        let priceText = $('.package-container > span:nth-child(2)').text().trim() ||
            $('span.unit-price-value').text().trim() ||
            $('.package-container').text().trim();

        // Clean up unit price
        const priceMatch = priceText.match(/৳\s*([\d.]+)/);
        const unitPrice = priceMatch ? parseFloat(priceMatch[1]) : null;

        // Strip Price extraction
        let stripPriceText = $('.package-container div:contains("Strip Price:")').text().trim() ||
            $('.package-container div').filter((i, el) => $(el).text().includes('Strip Price:')).text().trim();
        const stripPriceMatch = stripPriceText.match(/৳\s*([\d.]+)/);
        const stripPrice = stripPriceMatch ? parseFloat(stripPriceMatch[1]) : null;

        // Pack Info extraction (e.g., (51 x 10: ৳ 612.00))
        const packInfoText = $('.pack-size-info').text().trim();
        const tabletsPerStripMatch = packInfoText.match(/x\s*(\d+):/);
        const tabletsPerStrip = tabletsPerStripMatch ? parseInt(tabletsPerStripMatch[1]) : null;

        // Fetch image from Arogga
        const searchQuery = `${name} ${strength}`;
        const imageUrl = await fetchAroggaImage(searchQuery);

        return NextResponse.json({
            product: {
                name,
                genericName: generic,
                brandName: brand,
                strength,
                dosageForm,
                therapeuticClass,
                sellingPrice: unitPrice, // Default selling price is unit price
                unitPrice,
                stripPrice,
                tabletsPerStrip,
                imageUrl,
                sourceUrl: url,
                source: 'medex',
            }
        });
    } catch (error) {
        console.error('Medex scraper error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
