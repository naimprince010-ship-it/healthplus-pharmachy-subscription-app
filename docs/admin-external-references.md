# External references for admin UX (bookmark list)

Use these as **ideas only**—do not vendor whole templates into Halalzi. Prefer patterns that match Next.js App Router + your existing Tailwind stack.

## Navigation & settings hub

- Search: `Next.js app router admin layout sidebar active route`
- Search: `settings singleton admin panel zod`
- Typical examples to skim (repos change over time): shadcn dashboard examples, Vercel commerce admin patterns (architecture only).

## Duplicate routes / IA

- Search: `ecommerce admin catalog vs medicines split`
- Medusa / Saleor docs: how they separate **product types** and **admin modules**—useful vocabulary for Products vs Medicines training, not necessarily their stack.

## Checkout configuration

- Search: `checkout field configuration admin` `localization strings separate from feature flags`

## Membership vs subscription naming

- Any subscription-platform admin doc that distinguishes **plans** vs **member tiers** helps internal docs; Halalzi already uses distinct Prisma models—keep audit table updated.

Review this list quarterly; replace broken links by re-searching the phrase, not pinning to one fork forever.
