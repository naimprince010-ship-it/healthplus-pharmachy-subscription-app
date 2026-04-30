# Blog AI Tags Guide

This guide keeps blog product mapping accurate by improving `Product.aiTags`.

## Recommended tag format

- Use lowercase tags: `cleanser`, `oily-skin`, `vitamin-c`
- Use short, reusable intent tags (not long sentences)
- Keep 5-12 tags per beauty product
- Always include at least one step tag (`cleanser` / `toner` / `serum` / `moisturizer` / `sunscreen`)

## Beauty tag checklist

- **Step tag:** `cleanser`, `toner`, `serum`, `moisturizer`, `sunscreen`
- **Concern tag:** `acne`, `brightening`, `hydration`, `anti-aging`, `pigmentation`
- **Skin type tag:** `oily-skin`, `dry-skin`, `combination-skin`, `sensitive-skin`
- **Ingredient tag:** `vitamin-c`, `niacinamide`, `hyaluronic-acid`, `retinol`, `salicylic-acid`
- **Context tag (optional):** `daytime`, `night-routine`, `daily-use`

## Good examples

- Cleanser product:
  - `["beauty", "skincare", "cleanser", "oily-skin", "acne", "daily-use"]`
- Vitamin C serum:
  - `["beauty", "skincare", "serum", "vitamin-c", "brightening", "pigmentation", "daytime"]`
- Sunscreen:
  - `["beauty", "skincare", "sunscreen", "spf", "daytime", "sensitive-skin"]`

## Auto-tag script

Script path: `scripts/autotag-beauty-products.ts`

Commands:

- Preview only:
  - `npm run blog:autotag-beauty -- --dry-run`
- Apply updates:
  - `npm run blog:autotag-beauty`
- Only products with empty tags:
  - `npm run blog:autotag-beauty -- --only-empty`

