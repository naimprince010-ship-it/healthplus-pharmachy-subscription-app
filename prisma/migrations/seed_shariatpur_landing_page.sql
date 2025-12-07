-- Seed data for Shariatpur-specific landing page (SEO optimized)
-- Run this in Supabase SQL Editor after running landing_page_migration.sql

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
  'shariatpur-landing-page-001',
  'শরীয়তপুরে অনলাইন গ্রোসারি ও ওষুধ ডেলিভারি | Halalzi',
  'shariatpur-grocery-delivery',
  'PUBLISHED',
  '[
    {
      "id": "shariatpur-hero-1",
      "type": "hero",
      "order": 0,
      "config": {
        "headline": "শরীয়তপুরে অনলাইন গ্রোসারি ও ওষুধ ডেলিভারি",
        "subheadline": "শরীয়তপুর জেলার যেকোনো স্থানে ঘরে বসে হালাল ওষুধ ও মুদিপণ্য অর্ডার করুন। Registered pharmacist-এর তত্ত্বাবধানে নিরাপদ ডেলিভারি।",
        "ctaText": "এখনই অর্ডার করুন",
        "ctaLink": "/",
        "badge": "শরীয়তপুরে ডেলিভারি চালু",
        "trustBadges": ["শরীয়তপুর জেলায় সেবা", "100% হালাল পণ্য", "Pharmacist Supervised"]
      }
    },
    {
      "id": "shariatpur-problem-1",
      "type": "problem",
      "order": 1,
      "config": {
        "title": "শরীয়তপুরে এই সমস্যাগুলো কি ফেইস করেন?",
        "pains": [
          "শরীয়তপুর শহরে ভালো ফার্মেসি খুঁজে পাওয়া কঠিন",
          "গ্রোসারি কিনতে বাজারে যেতে অনেক সময় লাগে",
          "অনলাইনে অর্ডার করলে শরীয়তপুরে ডেলিভারি পাওয়া যায় না",
          "ওষুধের quality নিয়ে সন্দেহ থাকে",
          "বয়স্ক বাবা-মায়ের জন্য ওষুধ পাঠানো কঠিন"
        ]
      }
    },
    {
      "id": "shariatpur-benefits-1",
      "type": "benefits",
      "order": 2,
      "config": {
        "title": "শরীয়তপুরে Halalzi কেন বেছে নেবেন?",
        "items": [
          {"icon": "mapPin", "title": "শরীয়তপুর জেলায় ডেলিভারি", "description": "শরীয়তপুর সদর, নড়িয়া, জাজিরা, গোসাইরহাট, ভেদরগঞ্জ, ডামুড্যা সহ সব উপজেলায়"},
          {"icon": "clock", "title": "দ্রুত ডেলিভারি", "description": "শরীয়তপুর শহরে ২৪-৪৮ ঘণ্টায় ডেলিভারি"},
          {"icon": "shield", "title": "নিরাপদ ও হালাল", "description": "Pharmacist verified ওষুধ ও হালাল গ্রোসারি"},
          {"icon": "tag", "title": "সাশ্রয়ী মূল্য", "description": "বাজার দরের চেয়ে কম মূল্যে পণ্য"},
          {"icon": "phone", "title": "সহজ অর্ডার", "description": "মোবাইল থেকে সহজেই অর্ডার করুন"}
        ]
      }
    },
    {
      "id": "shariatpur-howitworks-1",
      "type": "howItWorks",
      "order": 3,
      "config": {
        "title": "শরীয়তপুরে কিভাবে অর্ডার করবেন?",
        "steps": [
          {"number": "1", "title": "শরীয়তপুর সিলেক্ট করুন", "description": "আপনার উপজেলা ও ঠিকানা দিন"},
          {"number": "2", "title": "পণ্য বাছাই করুন", "description": "ওষুধ বা গ্রোসারি কার্টে যোগ করুন"},
          {"number": "3", "title": "Prescription আপলোড", "description": "ওষুধের জন্য prescription দিন (প্রয়োজনে)"},
          {"number": "4", "title": "ডেলিভারি নিন", "description": "শরীয়তপুরে আপনার দরজায় পৌঁছে যাবে"}
        ]
      }
    },
    {
      "id": "shariatpur-pricing-1",
      "type": "pricing",
      "order": 4,
      "config": {
        "title": "শরীয়তপুরে ডেলিভারি চার্জ",
        "description": "শরীয়তপুর সদরে ৫০ টাকা, অন্যান্য উপজেলায় ৮০-১২০ টাকা। ১০০০ টাকার উপরে অর্ডারে ফ্রি ডেলিভারি!",
        "ctaText": "এখনই অর্ডার করুন",
        "ctaLink": "/"
      }
    },
    {
      "id": "shariatpur-testimonials-1",
      "type": "testimonials",
      "order": 5,
      "config": {
        "title": "শরীয়তপুরের গ্রাহকরা কী বলছেন",
        "items": [
          {"name": "মোঃ আব্দুল হাকিম", "location": "শরীয়তপুর সদর", "quote": "শরীয়তপুরে থেকে অনলাইনে ওষুধ পাওয়া অনেক কঠিন ছিল। Halalzi এসে সমস্যার সমাধান হয়ে গেছে। এখন ঘরে বসেই সব পাই।", "rating": 5},
          {"name": "ফাতেমা আক্তার", "location": "নড়িয়া, শরীয়তপুর", "quote": "আমার বাবা-মা শরীয়তপুরে থাকেন। এখন আমি ঢাকা থেকে তাদের জন্য ওষুধ অর্ডার করে দিতে পারি। অনেক সুবিধা।", "rating": 5},
          {"name": "মোঃ রফিকুল ইসলাম", "location": "ভেদরগঞ্জ, শরীয়তপুর", "quote": "গ্রোসারি আর ওষুধ এক জায়গা থেকে পাওয়া যায়। ডেলিভারিও সময়মতো আসে। Very happy with the service.", "rating": 5}
        ]
      }
    },
    {
      "id": "shariatpur-faq-1",
      "type": "faq",
      "order": 6,
      "config": {
        "title": "শরীয়তপুর ডেলিভারি সম্পর্কে প্রশ্ন",
        "items": [
          {"question": "শরীয়তপুরের কোন কোন এলাকায় ডেলিভারি দেন?", "answer": "আমরা শরীয়তপুর সদর, নড়িয়া, জাজিরা, গোসাইরহাট, ভেদরগঞ্জ, ডামুড্যা সহ শরীয়তপুর জেলার সব উপজেলায় ডেলিভারি দিই।"},
          {"question": "শরীয়তপুরে ডেলিভারি পেতে কতদিন লাগে?", "answer": "শরীয়তপুর সদরে সাধারণত ২৪-৪৮ ঘণ্টায় ডেলিভারি হয়। অন্যান্য উপজেলায় ২-৩ দিন সময় লাগতে পারে।"},
          {"question": "শরীয়তপুরে ডেলিভারি চার্জ কত?", "answer": "শরীয়তপুর সদরে ৫০ টাকা, অন্যান্য উপজেলায় ৮০-১২০ টাকা। ১০০০ টাকার উপরে অর্ডারে ফ্রি ডেলিভারি।"},
          {"question": "শরীয়তপুরে Cash on Delivery আছে?", "answer": "হ্যাঁ, শরীয়তপুরে Cash on Delivery, bKash, Nagad সব payment option available।"},
          {"question": "Prescription ওষুধ কি শরীয়তপুরে পাঠাতে পারবেন?", "answer": "হ্যাঁ, valid prescription আপলোড করলে আমরা শরীয়তপুরে prescription ওষুধও ডেলিভারি দিই।"}
        ]
      }
    },
    {
      "id": "shariatpur-finalcta-1",
      "type": "finalCta",
      "order": 7,
      "config": {
        "headline": "শরীয়তপুরে আজই আপনার প্রথম অর্ডার করুন!",
        "ctaText": "এখনই অর্ডার করুন",
        "ctaLink": "/",
        "trustIndicators": ["শরীয়তপুর জেলায় ডেলিভারি", "১০০০+ সন্তুষ্ট গ্রাহক", "24/7 Support"]
      }
    }
  ]'::jsonb,
  'শরীয়তপুরে অনলাইন গ্রোসারি ও ওষুধ ডেলিভারি | Halalzi - Online Grocery Shariatpur',
  'শরীয়তপুর জেলায় অনলাইন গ্রোসারি ও ওষুধ ডেলিভারি সেবা। শরীয়তপুর সদর, নড়িয়া, জাজিরা, ভেদরগঞ্জ সহ সব উপজেলায় হালাল পণ্য ও pharmacist verified ওষুধ পান ঘরে বসে।',
  '#036666',
  NOW(),
  NOW(),
  NOW()
);
