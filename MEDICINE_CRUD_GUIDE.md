# Medicine Management CRUD System - Usage Guide

## Overview

This guide explains how to use the new Medicine Management CRUD system that has been implemented in HealthPlus. The system provides a complete admin interface for managing medicines with search, filtering, pagination, and SEO support.

## ⚠️ IMPORTANT: Deployment Steps

Before the system can work in production, you **MUST** run the database migration to add the new fields to the Medicine table.

### Step 1: Run the Migration Script

Connect to your production database and run the migration script:

```bash
# Option 1: Using the migration script (recommended)
npx tsx scripts/migrate-medicine-fields.ts

# Option 2: Run the SQL migration directly
psql $DATABASE_URL -f prisma/migrations/add_medicine_crud_fields.sql
```

The migration script will:
- Add new fields: `slug`, `brandName`, `dosageForm`, `packSize`, `mrp`, `sellingPrice`, `minStockAlert`, SEO fields, `isFeatured`, `deletedAt`
- Backfill existing data: `sellingPrice` from `price`, `brandName` from `manufacturer`
- Generate unique slugs for all existing medicines
- Maintain backward compatibility with old fields

### Step 2: Verify Migration

After running the migration, verify that the new columns exist:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'Medicine' 
AND column_name IN ('slug', 'sellingPrice', 'brandName', 'seoTitle');
```

### Step 3: Deploy to Vercel

Once the migration is complete, the Vercel deployment will succeed and the app will be fully functional.

## Features

### Admin Panel - Medicine Management

#### 1. Medicines List (`/admin/medicines`)

**Features:**
- View all medicines in a paginated table
- Search by name, generic name, or brand name
- Filter by category and status (Active/Inactive)
- See featured medicines marked with a star (★)
- View pricing with MRP strikethrough when discounted
- Quick actions: Edit and Delete buttons for each medicine

**How to Access:**
1. Log in as an admin user
2. Navigate to `/admin/medicines`
3. Use the search bar to find specific medicines
4. Click "Filters" to filter by category or status
5. Use Previous/Next buttons for pagination

#### 2. Add Medicine (`/admin/medicines/new`)

**Required Fields:**
- **Name**: Medicine name (e.g., "Paracetamol 500mg")
- **Category**: Select from existing categories
- **Selling Price**: The actual price customers pay

**Optional Fields:**

**Basic Information:**
- Generic Name: Scientific/generic name
- Brand Name: Manufacturer's brand name
- Dosage Form: Tablet, Capsule, Syrup, Injection, etc.
- Strength: e.g., "500mg", "10ml"
- Pack Size: e.g., "1 strip x 10 tablets"
- Description: Detailed product description

**Pricing & Stock:**
- MRP: Maximum Retail Price (must be ≥ selling price)
- Stock Quantity: Current inventory count
- Low Stock Alert: Threshold for low stock warnings

**SEO & Metadata:**
- SEO Title: Custom title for search engines (defaults to medicine name)
- SEO Description: Meta description for search results
- SEO Keywords: Comma-separated keywords
- Canonical URL: Preferred URL for this product

**Media:**
- Image URL: Full URL to product image

**Settings:**
- Requires Prescription: Check if medicine needs prescription
- Featured Medicine: Mark as featured to highlight on homepage
- Active: Uncheck to hide from customers (soft disable)

**How to Add:**
1. Go to `/admin/medicines`
2. Click "Add Medicine" button
3. Fill in the required fields (Name, Category, Selling Price)
4. Add optional fields as needed
5. Click "Create Medicine"
6. You'll be redirected to the medicines list with a success message

#### 3. Edit Medicine (`/admin/medicines/[id]/edit`)

**Features:**
- All fields from Add Medicine form
- Pre-populated with existing data
- Slug is automatically regenerated if name changes
- Maintains backward compatibility with old price fields

**How to Edit:**
1. Go to `/admin/medicines`
2. Click the Edit icon (pencil) next to any medicine
3. Update the fields you want to change
4. Click "Update Medicine"
5. You'll be redirected to the medicines list with a success message

#### 4. Delete Medicine

**Behavior:**
- **Soft Delete**: If medicine is used in orders or subscriptions, it will be marked as inactive and hidden from customers, but data is preserved for historical records
- **Hard Delete**: If medicine has no dependencies, it will be permanently deleted

**How to Delete:**
1. Go to `/admin/medicines`
2. Click the Delete icon (trash) next to any medicine
3. Confirm the deletion in the dialog
4. Medicine will be removed or soft-deleted based on dependencies

### Frontend - Public Catalog (`/medicines`)

**Features:**
- Browse all active medicines
- Search by name, generic name, or brand name
- Filter by category using category pills
- View medicine cards with:
  - Product image (or placeholder if no image)
  - Medicine name and generic name
  - Strength information
  - Selling price with MRP strikethrough if discounted
  - Featured badge for highlighted products
  - Prescription required badge (Rx)
  - Out of stock indicator
- Click any medicine to view details (uses slug for SEO-friendly URLs)

**Customer Experience:**
1. Visit `/medicines` to browse the catalog
2. Use the search bar to find specific medicines
3. Click category pills to filter by category
4. Click on any medicine card to view details
5. Only active medicines with `isActive=true` and `deletedAt=null` are shown

## API Endpoints

### GET `/api/admin/medicines`
List medicines with search, filter, and pagination.

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)
- `search`: Search by name, generic name, or brand name
- `categoryId`: Filter by category ID
- `isActive`: Filter by status ("true", "false", or "all")
- `isFeatured`: Filter featured medicines ("true", "false", or "all")
- `requiresPrescription`: Filter by prescription requirement ("true", "false", or "all")
- `sortBy`: Sort field (name, createdAt, updatedAt, sellingPrice, stockQuantity)
- `sortOrder`: Sort direction (asc, desc)

**Response:**
```json
{
  "medicines": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

### POST `/api/admin/medicines`
Create a new medicine.

**Request Body:**
```json
{
  "name": "Paracetamol 500mg",
  "genericName": "Acetaminophen",
  "brandName": "Napa",
  "categoryId": "category-id",
  "sellingPrice": 5.0,
  "mrp": 6.0,
  "stockQuantity": 100,
  "requiresPrescription": false,
  "isActive": true
}
```

### GET `/api/admin/medicines/[id]`
Get a single medicine by ID.

### PUT `/api/admin/medicines/[id]`
Update a medicine.

### DELETE `/api/admin/medicines/[id]`
Delete a medicine (soft delete if has dependencies).

## Field Descriptions

### Core Fields
- **slug**: Auto-generated URL-friendly identifier (e.g., "paracetamol-500mg")
- **name**: Display name of the medicine
- **genericName**: Scientific/generic name
- **brandName**: Manufacturer's brand name

### Pricing Fields
- **sellingPrice**: Actual price customers pay (required)
- **mrp**: Maximum Retail Price (optional, must be ≥ sellingPrice)
- **price**: Deprecated, maintained for backward compatibility

### Stock Fields
- **stockQuantity**: Current inventory count
- **minStockAlert**: Low stock threshold for alerts
- **inStock**: Auto-calculated based on stockQuantity

### SEO Fields
- **seoTitle**: Custom page title for search engines
- **seoDescription**: Meta description for search results
- **seoKeywords**: Comma-separated keywords
- **canonicalUrl**: Preferred URL for this product
- **isFeatured**: Mark as featured product

### Status Fields
- **isActive**: Whether medicine is visible to customers
- **deletedAt**: Soft delete timestamp (null if not deleted)
- **requiresPrescription**: Whether prescription is required

## Limitations

### Current Limitations
1. **No Bulk Import/Export**: Medicines must be added one at a time through the UI
2. **No Image Upload**: Images must be hosted externally and linked via URL
3. **No Inventory Tracking**: Stock updates are manual, no automatic deduction on orders
4. **No Price History**: Previous prices are not tracked
5. **No Multi-language Support**: All content is in a single language

### Future Enhancements
- Bulk CSV import/export
- Direct image upload to cloud storage
- Automatic inventory management
- Price history and analytics
- Multi-language support
- Advanced search with filters
- Medicine variants (different strengths/pack sizes)

## Troubleshooting

### Issue: "Column does not exist" error
**Solution**: Run the migration script first (see Deployment Steps above)

### Issue: Slug collision error
**Solution**: The system automatically handles slug collisions by appending -2, -3, etc. This should not occur in normal usage.

### Issue: "Selling price cannot be greater than MRP"
**Solution**: Ensure MRP is greater than or equal to selling price, or leave MRP empty.

### Issue: Medicine not showing on frontend
**Solution**: Check that:
- `isActive` is set to `true`
- `deletedAt` is `null`
- Medicine has a valid category
- Stock quantity is greater than 0 (if you want to show in-stock items only)

## Security Considerations

1. **Admin-Only Access**: All medicine management APIs require ADMIN role
2. **Input Validation**: All inputs are validated using Zod schemas
3. **SQL Injection Protection**: Prisma ORM prevents SQL injection
4. **Soft Delete**: Preserves data integrity for historical records
5. **Audit Trail**: All changes include timestamps (createdAt, updatedAt)

## Best Practices

1. **Always fill SEO fields** for better search engine visibility
2. **Use descriptive names** that include strength and form (e.g., "Paracetamol 500mg Tablet")
3. **Set MRP correctly** to show discounts to customers
4. **Configure low stock alerts** to avoid stockouts
5. **Use featured flag sparingly** to highlight important products
6. **Add detailed descriptions** to help customers make informed decisions
7. **Keep images consistent** in size and quality for better UX

## Support

For issues or questions:
1. Check this guide first
2. Review the API documentation
3. Check the database schema in `docs/DATABASE_SCHEMA.md`
4. Review the system architecture in `docs/ARCHITECTURE.md`
5. Contact the development team

---

**Last Updated**: November 22, 2025
**Version**: 1.0.0
