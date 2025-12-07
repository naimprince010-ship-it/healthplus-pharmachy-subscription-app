-- Seed: Add Halalzi landing page to the dynamic landing page builder
-- Run this in Supabase SQL Editor after running landing_page_migration.sql
-- Note: solution and whatYouGet sections from the original page are not included
-- as they don't have corresponding section types in the builder yet.

INSERT INTO "LandingPage" (
  "id",
  "title",
  "slug",
  "status",
  "sections",
  "metaTitle",
  "metaDescription",
  "primaryColor",
  "createdAt",
  "updatedAt",
  "publishedAt"
) VALUES (
  'halalzi-landing-page-001',
  'Halalzi – ঘরে বসে হালাল ওষুধ আর মুদিপণ্য, এক ক্লিকে আপনার দরজায়',
  'halalzi-offer',
  'PUBLISHED',
  '[
    {
      "id": "halalzi-hero-1",
      "type": "hero",
      "order": 0,
      "config": {
        "headline": "Halalzi – ঘরে বসে হালাল ওষুধ আর মুদিপণ্য, এক ক্লিকে আপনার দরজায়",
        "subheadline": "Registered pharmacist-এর তত্ত্বাবধানে verified ফার্মেসি + grocery এক প্ল্যাটফর্মে।",
        "ctaText": "Order Now on Halalzi",
        "ctaLink": "/",
        "trustBadges": ["100% Halal Focus", "Pharmacist Supervised", "Verified Partner Stores"]
      }
    },
    {
      "id": "halalzi-problem-1",
      "type": "problem",
      "order": 1,
      "config": {
        "title": "এই সমস্যাগুলো কি ফেইস করেন?",
        "pains": [
          "ওষুধ অর্ডার করলে নিরাপত্তা নিশ্চিত না হওয়া",
          "Random দোকান থেকে product আসার ভয়",
          "Hidden charges বোঝা কঠিন",
          "আলাদা আলাদা দোকান থেকে অর্ডারের ঝামেলা",
          "Delivery বিলম্ব"
        ]
      }
    },
    {
      "id": "halalzi-benefits-1",
      "type": "benefits",
      "order": 2,
      "config": {
        "title": "আপনার জন্য কী আছে?",
        "items": [
          {"icon": "clock", "title": "সময় বাঁচান", "description": "এক অর্ডারে সব কিছু"},
          {"icon": "shield", "title": "Safe & Halal", "description": "100% verified products"},
          {"icon": "tag", "title": "Transparent Pricing", "description": "কোনো hidden charge নেই"},
          {"icon": "check", "title": "Verified Partners", "description": "বিশ্বস্ত দোকান থেকে ডেলিভারি"},
          {"icon": "headphones", "title": "Priority Support", "description": "যেকোনো সমস্যায় সাহায্য"}
        ]
      }
    },
    {
      "id": "halalzi-howitworks-1",
      "type": "howItWorks",
      "order": 3,
      "config": {
        "title": "কিভাবে কাজ করে?",
        "steps": [
          {"number": "1", "title": "Location Select", "description": "আপনার এলাকা সিলেক্ট করুন"},
          {"number": "2", "title": "Product Add to Cart", "description": "পণ্য বাছাই করে কার্টে যোগ করুন"},
          {"number": "3", "title": "Prescription Upload", "description": "প্রয়োজনে prescription আপলোড করুন"},
          {"number": "4", "title": "Pay & Receive", "description": "পেমেন্ট করুন ও ডেলিভারি নিন"}
        ]
      }
    },
    {
      "id": "halalzi-pricing-1",
      "type": "pricing",
      "order": 4,
      "config": {
        "title": "আজই শুরু করুন – কোনো ঝামেলা ছাড়াই",
        "description": "App ব্যবহার ফ্রি। ডেলিভারি চার্জ checkout এ clear দেখানো হবে।",
        "ctaText": "Get Started",
        "ctaLink": "/"
      }
    },
    {
      "id": "halalzi-testimonials-1",
      "type": "testimonials",
      "order": 5,
      "config": {
        "title": "আমাদের গ্রাহকরা কী বলছেন",
        "items": [
          {"name": "রাহিমা খাতুন", "location": "মিরপুর, ঢাকা", "quote": "Halalzi থেকে ওষুধ অর্ডার করে অনেক শান্তি পেয়েছি। Pharmacist supervised delivery সত্যিই ভরসার।", "rating": 5},
          {"name": "আব্দুল করিম", "location": "উত্তরা, ঢাকা", "quote": "এক জায়গা থেকে medicine আর grocery দুটোই পাই। সময় অনেক বাঁচে। Highly recommended!", "rating": 5},
          {"name": "ফাতেমা বেগম", "location": "ধানমন্ডি, ঢাকা", "quote": "Transparent pricing আর fast delivery - এই দুটো জিনিস Halalzi-তে পেয়েছি। আর কোথাও যাব না।", "rating": 5}
        ]
      }
    },
    {
      "id": "halalzi-faq-1",
      "type": "faq",
      "order": 6,
      "config": {
        "title": "সচরাচর জিজ্ঞাসা",
        "items": [
          {"question": "Halalzi কি সব এলাকায় ডেলিভারি দেয়?", "answer": "বর্তমানে আমরা ঢাকা শহরের প্রধান এলাকাগুলোতে ডেলিভারি দিচ্ছি। শীঘ্রই আরো এলাকায় সম্প্রসারিত হবে।"},
          {"question": "Prescription ছাড়া কি ওষুধ অর্ডার করা যায়?", "answer": "OTC (Over-the-counter) ওষুধ prescription ছাড়াই অর্ডার করতে পারবেন। Prescription medicine-এর জন্য valid prescription আপলোড করতে হবে।"},
          {"question": "ডেলিভারি চার্জ কত?", "answer": "ডেলিভারি চার্জ আপনার এলাকা ও অর্ডার সাইজের উপর নির্ভর করে। Checkout-এ সব চার্জ clear দেখানো হয়।"},
          {"question": "পেমেন্ট কিভাবে করব?", "answer": "Cash on Delivery, bKash, Nagad, এবং Card payment - সব অপশন available।"},
          {"question": "অর্ডার ক্যান্সেল করতে পারব?", "answer": "হ্যাঁ, dispatch হওয়ার আগে যেকোনো সময় অর্ডার ক্যান্সেল করতে পারবেন।"}
        ]
      }
    },
    {
      "id": "halalzi-finalcta-1",
      "type": "finalCta",
      "order": 7,
      "config": {
        "headline": "আপনার পরিবারের জন্য হালাল, সেফ আর স্মার্ট shopping শুরু হবে কখন?",
        "ctaText": "Start Your First Order",
        "ctaLink": "/"
      }
    }
  ]'::jsonb,
  'Halalzi - হালাল ওষুধ ও মুদিপণ্য ডেলিভারি | Order Now',
  'Halalzi - ঘরে বসে হালাল ওষুধ আর মুদিপণ্য, এক ক্লিকে আপনার দরজায়। Registered pharmacist-এর তত্ত্বাবধানে verified ফার্মেসি + grocery এক প্ল্যাটফর্মে।',
  '#036666',
  NOW(),
  NOW(),
  NOW()
);
