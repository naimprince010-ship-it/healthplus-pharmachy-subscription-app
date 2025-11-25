# Product System Migration Guide

This guide explains how to migrate from the Medicine-only system to the new Product system that supports both medicines and general products.

## Overview

The new Product system introduces:
- **Product** base table with common fields (name, price, stock, images, SEO, category)
- **Medicine** table now links to Product (1:1 relation) for medicine-specific fields
- **ProductVariant** table for future variant support (sizes, colors)
- **General products** are simple Product rows without medicine details
- **Shared categories** between medicines and general products

## Migration Steps

### 1. Backup Database

**CRITICAL: Always backup your database before running migrations!**

```bash
# Using pg_dump (adjust connection details)
pg_dump -h your-host -U your-user -d your-database > backup_$(date +%Y%m%d_%H%M%S).sql
```

### 2. Run Database Migration

```bash
# Apply the schema migration
npx prisma migrate deploy

# Or manually run the SQL:
psql -h your-host -U your-user -d your-database -f prisma/migrations/20251125100000_add_product_system/migration.sql
```

This creates:
- `Product` table
- `ProductVariant` table
- `ProductType` enum (MEDICINE, GENERAL)
- Updates `Medicine` table to add `productId` column
- Updates `OrderItem` table to add `productId`, `productName`, `productType` columns
- Adds necessary indexes and foreign keys

### 3. Run Backfill Script

```bash
# Install tsx if not already installed
npm install -D tsx

# Run the backfill script
npx tsx scripts/migrate-medicines-to-products.ts
```

This script:
1. Creates Product records from existing Medicine records
2. Links Medicine.productId to the new Product
3. Backfills OrderItem.productId from medicineId
4. Validates the migration

**Expected output:**
```
🚀 Starting Medicine → Product migration...
📊 Found X medicines to migrate
✅ Created X Product records
✅ Updated X order items
✅ All medicines successfully migrated to Product system!
```

### 4. Verify Migration

```sql
-- Check Product count matches Medicine count
SELECT COUNT(*) FROM "Product" WHERE type = 'MEDICINE';
SELECT COUNT(*) FROM "Medicine";

-- Verify all medicines have productId
SELECT COUNT(*) FROM "Medicine" WHERE "productId" IS NULL;
-- Should return 0

-- Check OrderItem backfill
SELECT COUNT(*) FROM "OrderItem" WHERE "productId" IS NOT NULL;
```

### 5. Generate Prisma Client

```bash
npx prisma generate
```

### 6. Deploy Application

After successful migration, deploy the updated application code.

## Schema Changes

### Product Model (New)

```prisma
model Product {
  id          String      @id @default(cuid())
  type        ProductType // MEDICINE or GENERAL
  name        String
  slug        String      @unique
  description String?
  
  // Pricing
  mrp          Float?
  sellingPrice Float
  
  // Stock
  stockQuantity Int     @default(0)
  inStock       Boolean @default(true)
  
  // General Product Fields
  brandName     String?
  sizeLabel     String?
  unit          String  @default("pcs")
  variantLabel  String?
  keyFeatures   String?
  specSummary   String?
  
  // SEO
  seoTitle       String?
  seoDescription String?
  isFeatured     Boolean @default(false)
  
  // Membership discount override
  excludeFromMembershipDiscount Boolean @default(false)
  
  // Relations
  categoryId String
  category   Category
  medicine   Medicine? // 1:1 for medicine-specific fields
  variants   ProductVariant[]
  orderItems OrderItem[]
}
```

### Medicine Model (Updated)

```prisma
model Medicine {
  id           String  @id @default(cuid())
  productId    String  @unique // NEW: Link to Product
  product      Product @relation(...)
  
  // Medicine-specific fields only
  genericName  String?
  manufacturer String
  dosageForm   String?
  packSize     String?
  strength     String?
  
  // Medicine-specific details
  uses                String?
  sideEffects         String?
  contraindications   String?
  requiresPrescription Boolean @default(false)
  
  // Note: Common fields moved to Product
}
```

### OrderItem Model (Updated)

```prisma
model OrderItem {
  id         String   @id @default(cuid())
  orderId    String
  
  // NEW: Product reference (preferred)
  productId  String?
  product    Product?
  
  // Legacy: Medicine reference (backward compatibility)
  medicineId String?
  
  // Snapshot fields
  productName String?
  productType String?
  
  quantity   Int
  price      Float
  total      Float
}
```

## Adding General Products

### Via Admin UI

1. Navigate to `/admin/products`
2. Click "Add New Product"
3. Fill in the form:
   - Product Type: GENERAL
   - Name, Brand, Category
   - Size Label (e.g., "50ml", "100g")
   - Key Features, Description
   - Pricing, Stock
   - Images, SEO fields
4. Save

### Via API

```typescript
const product = await prisma.product.create({
  data: {
    type: 'GENERAL',
    name: 'Nivea Soft Moisturizing Cream',
    slug: 'nivea-soft-cream-50ml',
    brandName: 'Nivea',
    sizeLabel: '50ml',
    unit: 'ml',
    keyFeatures: 'Moisturizes skin\nSuitable for face and body\nNon-greasy formula',
    description: 'Nivea Soft is a light moisturizing cream...',
    mrp: 250,
    sellingPrice: 220,
    stockQuantity: 100,
    categoryId: 'skin-care-category-id',
    excludeFromMembershipDiscount: false, // Apply membership discount
  },
})
```

## Membership Discount Behavior

- **Default**: Both MEDICINE and GENERAL products get membership discounts
- **Override**: Set `excludeFromMembershipDiscount: true` to exclude specific products
- **Example**: Premium imported products might be excluded from discounts

## Product Variants (Future)

The `ProductVariant` table is ready for future use:

```typescript
// Example: Same product with different sizes
const product = await prisma.product.create({
  data: {
    type: 'GENERAL',
    name: 'Dove Shampoo',
    slug: 'dove-shampoo',
    // ... other fields
    variants: {
      create: [
        {
          variantName: '100ml',
          sizeLabel: '100ml',
          sellingPrice: 150,
          stockQuantity: 50,
        },
        {
          variantName: '200ml',
          sizeLabel: '200ml',
          sellingPrice: 280,
          stockQuantity: 30,
        },
      ],
    },
  },
})
```

## Rollback Plan

If you need to rollback:

1. **Restore database backup**:
   ```bash
   psql -h your-host -U your-user -d your-database < backup_YYYYMMDD_HHMMSS.sql
   ```

2. **Revert code changes**:
   ```bash
   git checkout main
   npm install
   npx prisma generate
   ```

## Troubleshooting

### Issue: Migration fails with foreign key constraint error

**Solution**: Ensure all medicines have valid categoryId before migration.

```sql
-- Check for invalid categories
SELECT * FROM "Medicine" WHERE "categoryId" NOT IN (SELECT id FROM "Category");
```

### Issue: Backfill script fails partway through

**Solution**: The script is idempotent. Fix the error and re-run:

```bash
npx tsx scripts/migrate-medicines-to-products.ts
```

It will skip already-migrated medicines.

### Issue: Some order items don't have productId

**Solution**: Run this SQL to backfill manually:

```sql
UPDATE "OrderItem" oi
SET 
  "productId" = m."productId",
  "productName" = p.name,
  "productType" = 'MEDICINE'
FROM "Medicine" m
JOIN "Product" p ON m."productId" = p.id
WHERE oi."medicineId" = m.id
  AND oi."productId" IS NULL;
```

## Support

If you encounter issues during migration:
1. Check the migration logs
2. Verify database backup is available
3. Review the troubleshooting section above
4. Contact support with error details

## Next Steps

After successful migration:
1. ✅ Test medicine browsing and ordering
2. ✅ Test adding general products via admin
3. ✅ Test cart and checkout with both product types
4. ✅ Verify membership discounts apply correctly
5. ✅ Test prescription upload (medicines only)
6. ✅ Monitor for any errors in production logs

---

**Migration completed successfully?** You can now add general products alongside medicines! 🎉
