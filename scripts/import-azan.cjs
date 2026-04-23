'use strict';

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');

const DATABASE_URL = {
  host: 'aws-1-ap-south-1.pooler.supabase.com',
  port: 5432,
  database: 'postgres',
  user: 'postgres.antgoexirugyssoddvun',
  password: 'HalalZi@DB2024!Secure',
  ssl: { rejectUnauthorized: false }
};

async function main() {
  const jsonPath = path.join(__dirname, '..', 'playwright-temp', 'azan_products.json');

  if (!fs.existsSync(jsonPath)) {
    console.log(`No products found at ${jsonPath}`);
    return;
  }

  const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  console.log(`Found ${data.length} products to import.\n`);

  const client = new Client(DATABASE_URL);
  await client.connect();
  console.log('Connected to database.');

  // Find or create category
  let categoryRes = await client.query(
    `SELECT id FROM "Category" WHERE name = 'Dropship Cosmetics' LIMIT 1`
  );

  let categoryId;
  if (categoryRes.rows.length > 0) {
    categoryId = categoryRes.rows[0].id;
    console.log(`Using existing category: Dropship Cosmetics (id: ${categoryId})`);
  } else {
    const ins = await client.query(
      `INSERT INTO "Category" (id, name, slug, "isActive", "isMedicineCategory", "createdAt", "updatedAt")
       VALUES ($1, 'Dropship Cosmetics', 'dropship-cosmetics', true, false, NOW(), NOW())
       RETURNING id`,
      [randomUUID()]
    );
    categoryId = ins.rows[0].id;
    console.log(`Created category: Dropship Cosmetics (id: ${categoryId})`);
  }

  let importedCount = 0;
  let skippedCount = 0;

  for (const item of data) {
    const name = (item.name || '').trim();
    if (!name || !item.supplierPrice) { skippedCount++; continue; }

    const supplierPrice = parseFloat(item.supplierPrice);
    const finalPrice = Math.ceil(supplierPrice * 1.6);
    const baseSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const imageUrl = item.imageUrl || null;
    const stock = item.stock ?? 0;

    try {
      // Check if product exists
      const existing = await client.query(
        `SELECT id FROM "Product" WHERE slug = $1 LIMIT 1`,
        [baseSlug]
      );

      if (existing.rows.length > 0) {
        await client.query(
          `UPDATE "Product"
           SET "sellingPrice" = $1, "purchasePrice" = $2, "stockQuantity" = $3,
               "imageUrl" = $4, mrp = $5, "inStock" = $6, "updatedAt" = NOW()
           WHERE slug = $7`,
          [finalPrice, supplierPrice, stock, imageUrl, finalPrice, stock > 0, baseSlug]
        );
        console.log(`🔄 Updated:  ${name.substring(0, 52).padEnd(52)} | ৳${supplierPrice} → ৳${finalPrice}`);
      } else {
        await client.query(
          `INSERT INTO "Product"
             (id, type, name, slug, "sellingPrice", "purchasePrice", mrp, "imageUrl",
              "stockQuantity", "isActive", "categoryId", unit, "inStock", "createdAt", "updatedAt")
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,NOW(),NOW())`,
          [randomUUID(), 'GENERAL', name, baseSlug, finalPrice, supplierPrice, finalPrice,
           imageUrl, stock, false, categoryId, 'pcs', stock > 0]
        );
        console.log(`✅ Imported: ${name.substring(0, 52).padEnd(52)} | ৳${supplierPrice} → ৳${finalPrice} | Stock: ${stock}`);
      }
      importedCount++;
    } catch (e) {
      skippedCount++;
      console.log(`❌ Failed:   ${name} — ${e.message}`);
    }
  }

  await client.end();

  console.log(`\n=== IMPORT COMPLETE ===`);
  console.log(`✅ Imported/Updated: ${importedCount}`);
  console.log(`❌ Skipped/Failed:   ${skippedCount}`);
  console.log(`All products are DRAFT (isActive: false). Activate manually from admin panel.`);
}

main().catch(e => { console.error('Fatal error:', e.message); process.exit(1); });
