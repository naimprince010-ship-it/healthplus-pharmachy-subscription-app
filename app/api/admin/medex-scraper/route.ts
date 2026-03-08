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
        const { url } = await req.json();

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

        // Check if it's a list page instead of a brand page
        if (pageTitle.toLowerCase().includes('list of') || !url.includes('/brands/')) {
            return NextResponse.json({
                error: 'Please provide a specific brand URL (e.g., medex.com.bd/brands/...) instead of a list or index page.'
            }, { status: 400 });
        }

        // Extract from HTML with NEW robust selectors (Medex updated their site)
        const name = $('h1.page-heading-1-l.brand').text().trim() || $('h1.n-title').text().trim() || titleParts[0] || 'Unknown';
        const generic = $('div[title="Generic Name"] a').first().text().trim() || $('div.brand-generics a').first().text().trim() || 'Generic not found';
        const strength = $('div[title="Strength"]').text().trim() || $('span.brand-strength').text().trim() || titleParts[1] || '';
        const brand = $('a.calm-link').first().text().trim() || titleParts.find(p => p.includes('Ltd') || p.includes('Pharm')) || 'Unknown';

        // Price extraction: often in .package-container > span
        let priceText = $('.package-container > span:nth-child(2)').text().trim() ||
            $('span.unit-price-value').text().trim() ||
            $('.package-container').text().trim();

        // Clean up price
        const priceMatch = priceText.match(/৳\s*([\d.]+)/);
        const price = priceMatch ? parseFloat(priceMatch[1]) : null;

        // Fetch image from Arogga
        const searchQuery = `${name} ${strength}`;
        const imageUrl = await fetchAroggaImage(searchQuery);

        return NextResponse.json({
            product: {
                name,
                genericName: generic,
                brandName: brand,
                strength,
                sellingPrice: price,
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
