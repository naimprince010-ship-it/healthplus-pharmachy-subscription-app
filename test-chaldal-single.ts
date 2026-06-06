import { importProductFromUrl } from './lib/importers/product-import';

async function main() {
  const product = await importProductFromUrl('https://chaldal.com/nestle-coffee-mate-coffee-creamer-box-450-gm');
  console.log(JSON.stringify(product, null, 2));
}

main().catch(console.error);
