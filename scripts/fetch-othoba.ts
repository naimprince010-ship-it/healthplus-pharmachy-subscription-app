import fs from 'fs';

async function fetchOthoba() {
    const url = 'https://www.othoba.com/cheese-3';
    console.log(`Fetching ${url}...`);
    try {
        const res = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
            }
        });
        const html = await res.text();
        fs.writeFileSync('othoba_sample.html', html);
        console.log(`Saved HTML. Length: ${html.length}`);
    } catch (err) {
        console.error('Fetch failed:', err);
    }
}

fetchOthoba();
