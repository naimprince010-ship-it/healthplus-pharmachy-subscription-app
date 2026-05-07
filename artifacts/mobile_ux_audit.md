# Mobile UX/UI Audit: Halalzi Home Page
**Date:** May 4, 2026
**Target Device:** Mobile Viewport (375x812)

I ran a simulated mobile session on the Halalzi homepage. Below are the key usability and UI problems identified that could negatively impact conversions and user experience on mobile devices.

![Mobile Audit Session](file:///C:/Users/User/.gemini/antigravity/brain/55724950-caa8-403a-adc4-45d5556ac330/mobile_home_ux_audit_1777883616582.webp)

## 1. Navigation & Floating Elements
> [!WARNING]
> **WhatsApp Button Overlap:** The floating WhatsApp button at the bottom right sits exactly on top of or too close to the "Profile" icon in the mobile bottom navigation bar. Users trying to access their profile frequently tap WhatsApp by mistake.
- **Cart Badge Misalignment:** The red notification badge on the Cart icon in the bottom menu is slightly misaligned on smaller screens, making the UI look a bit unpolished.

## 2. Product Card Usability
> [!CAUTION]
> **Add to Cart Button is Cramped:** The button text *"কার্টে যোগ করুন"* is too long for the narrow width of a mobile product card (`variant="compact"`). This makes the button feel cramped with almost zero padding on the sides.
- **Title Truncation Hides Crucial Info:** Product titles are truncated too aggressively (e.g., "YC Baby Shampoo Tear & Paraben Fr..."). On mobile, this hides important sizing information (like 100ml vs 200ml) which buyers need before adding to the cart.
- **+/- Quantity Counter:** When an item is in the cart, the minus and plus buttons are placed too close together on the small mobile card, increasing the chance of accidental taps (e.g., removing an item instead of adding).

## 3. Search Experience
> [!TIP]
> Search is the most used feature on e-commerce sites. These small frictions slow down the user.
- **Placeholder Jump:** On the homepage, the search bar says *"ওষুধ, ব্র্যান্ড বা লক্ষণ খুঁজুন"*. But when a user taps it and the search modal opens, the placeholder suddenly changes to *"কসমেটিক্স বা গ্রোসারি খুঁজুন..."*. This inconsistency is confusing.
- **Hard-to-tap Close Button:** The 'X' (close) button inside the search modal is too small. Users with larger fingers might struggle to close the search overlay easily.
- **Redundant English Text:** Inside the search modal, there is static English text ("Search for medicines, health products, and more...") which clutters the screen and breaks the otherwise Bengali-first experience.

## 4. Layout & Visual Flow
- **Hero Section is Too Tall:** The main banner (Hero section) takes up almost the entire first screen on mobile. Users have to scroll past a large "dead zone" just to see the first product. 
- **Missing Scroll Indicators:** The horizontal product carousels (like "Popular Categories" or "Baby Care") do not have clear visual cues (like an arrow or a fade effect). Users might not realize they can swipe left to see more products.
- **Tiny "View All" Links:** The "সব দেখুন" (View All) links placed at the top-right of product sections are quite small and too close to the edge of the screen, making them difficult to tap accurately.

---
**Recommendation:** Most of these are "quick wins." Fixing the WhatsApp button overlap and shortening the "Add to Cart" text will immediately improve the mobile shopping experience.
