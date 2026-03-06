
import { extractProductsFromCategory } from './lib/importers/product-import';

async function test() {
    try {
        const url = 'https://www.othoba.com/health-beauty';
        console.log('Testing Othoba category extraction for:', url);
        const products = await extractProductsFromCategory(url);
        console.log('Found', products.length, 'products');
        if (products.length > 0) {
            console.log('Sample product:', products[0]);
        }
    } catch (error) {
        console.error('Test failed:', error);
    }
}

test();
