import { scrapeAllSitesOnce } from '../lib/market-intel/scrapers'

async function testScrapers() {
    console.log('--- Starting Scraper Test ---')
    try {
        const products = await scrapeAllSitesOnce()
        console.log(`Total products scraped: ${products.length}`)

        const sites = [...new Set(products.map(p => p.siteName))]
        sites.forEach(site => {
            const siteProducts = products.filter(p => p.siteName === site)
            console.log(`${site}: Found ${siteProducts.length} products`)
            if (siteProducts.length > 0) {
                console.log(`Sample: ${siteProducts[0].productName} - ৳${siteProducts[0].price}`)
            }
        })
    } catch (err) {
        console.error('Scraper test failed:', err)
    }
}

testScrapers()
