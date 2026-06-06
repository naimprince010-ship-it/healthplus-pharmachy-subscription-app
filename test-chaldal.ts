import { extractProductsFromCategory } from './lib/importers/product-import';

async function main() {
  const products = await extractProductsFromCategory('https://chaldal.com/condensed-milk-cream');
  console.log(JSON.stringify(products, null, 2));
}

main().catch(console.error);
