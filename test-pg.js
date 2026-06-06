require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  const { rows } = await pool.query(`SELECT * FROM "Product" WHERE slug = 'meril-baby-gel-toothpaste-strawberry'`);
  console.log(rows);
  const variants = await pool.query(`SELECT * FROM "ProductVariant" WHERE "productId" = $1`, [rows[0].id]);
  console.log('Variants:', variants.rows);
}

main().catch(console.error).finally(() => pool.end());
