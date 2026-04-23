import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  const jsonPath = path.join(process.cwd(), 'playwright-temp', 'azan_products.json');

  if (!fs.existsSync(jsonPath)) {
    console.log(`No products found at ${jsonPath}, skipping import.`);
    return;
  }

  const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  console.log(`Found ${data.length} products to import.`);

  // Find or create category once
  let category = await prisma.category.findUnique({ where: { name: 'Dropship Cosmetics' } });
  if (!category) {
    category = await prisma.category.create({
      data: {
        name: 'Dropship Cosmetics',
        slug: 'dropship-cosmetics',
        isActive: true,
        isMedicineCategory: false,
      },
    });
    console.log('Created category: Dropship Cosmetics');
  }

  let importedCount = 0;
  let skippedCount = 0;

  for (const item of data) {
    const name = item.name?.trim();
    if (!name || !item.supplierPrice) {
      skippedCount++;
      continue;
    }

    const supplierPrice = parseFloat(item.supplierPrice);
    const finalPrice = Math.ceil(supplierPrice * 1.6);
    const baseSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    try {
      await prisma.product.upsert({
        where: { slug: baseSlug },
        update: {
          sellingPrice: finalPrice,
          purchasePrice: supplierPrice,
          stockQuantity: item.stock ?? 0,
          imageUrl: item.imageUrl || null,
          mrp: finalPrice,
          inStock: (item.stock ?? 0) > 0,
        },
        create: {
          type: 'GENERAL',
          name,
          slug: baseSlug,
          sellingPrice: finalPrice,
          purchasePrice: supplierPrice,
          mrp: finalPrice,
          imageUrl: item.imageUrl || null,
          stockQuantity: item.stock ?? 0,
          isActive: false,
          categoryId: category.id,
          unit: 'pcs',
          inStock: (item.stock ?? 0) > 0,
        },
      });

      importedCount++;
      console.log(`✅ ${name.substring(0, 55).padEnd(55)} | Supplier: ৳${supplierPrice} → Sell: ৳${finalPrice} | Stock: ${item.stock}`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      skippedCount++;
      console.log(`❌ Failed: ${name} — ${msg}`);
    }
  }

  console.log(`\n=== IMPORT COMPLETE ===`);
  console.log(`✅ Imported: ${importedCount}`);
  console.log(`⏭️  Skipped/Failed: ${skippedCount}`);
  console.log(`All products saved as DRAFT (isActive: false). Activate them manually from admin panel.`);
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
