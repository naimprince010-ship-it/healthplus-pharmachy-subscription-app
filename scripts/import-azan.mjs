import pkg from '@prisma/client';
const { PrismaClient } = pkg;
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

  let importedCount = 0;
  for (const item of data) {
    const name = item.name;
    const supplierPrice = parseFloat(item.supplierPrice);
    
    // Applying 60% profit margin as requested
    const finalPrice = Math.ceil(supplierPrice * 1.6);
    
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now().toString().slice(-4);

    try {
      // Find or create category
      let category = await prisma.category.findUnique({ where: { name: 'Dropship Cosmetics' } });
      if (!category) {
        category = await prisma.category.create({
          data: {
            name: 'Dropship Cosmetics',
            slug: 'dropship-cosmetics',
            isActive: true,
            isMedicineCategory: false
          }
        });
      }

      await prisma.product.upsert({
        where: { slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-') },
        update: {
          sellingPrice: finalPrice,
          purchasePrice: supplierPrice,
          stockQuantity: item.stock,
          imageUrl: item.imageUrl,
          mrp: finalPrice
        },
        create: {
          type: 'GENERAL',
          name: name,
          slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          sellingPrice: finalPrice,
          purchasePrice: supplierPrice,
          mrp: finalPrice,
          imageUrl: item.imageUrl,
          stockQuantity: item.stock,
          isActive: false, // Default to Draft
          categoryId: category.id,
          unit: 'pcs',
          inStock: item.stock > 0
        }
      });
      importedCount++;
      console.log(`Imported: ${name} (Price: ${finalPrice}, Supplier: ${supplierPrice})`);
    } catch (e) {
      console.log(`Failed to import item ${name}:`, e.message);
    }
  }

  console.log(`Successfully imported ${importedCount} products into database as Drafts.`);
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
