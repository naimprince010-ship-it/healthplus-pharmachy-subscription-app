import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient({})

async function main() {
  console.log('🌱 Starting database seed...')

  console.log('📍 Creating delivery zones...')
  const zones = await Promise.all([
    prisma.zone.upsert({
      where: { name: 'Dhaka Central' },
      update: {},
      create: {
        name: 'Dhaka Central',
        deliveryCharge: 60,
        deliveryDays: '1-2 days',
        isActive: true,
      },
    }),
    prisma.zone.upsert({
      where: { name: 'Dhaka North' },
      update: {},
      create: {
        name: 'Dhaka North',
        deliveryCharge: 80,
        deliveryDays: '2-3 days',
        isActive: true,
      },
    }),
    prisma.zone.upsert({
      where: { name: 'Dhaka South' },
      update: {},
      create: {
        name: 'Dhaka South',
        deliveryCharge: 80,
        deliveryDays: '2-3 days',
        isActive: true,
      },
    }),
    prisma.zone.upsert({
      where: { name: 'Chittagong' },
      update: {},
      create: {
        name: 'Chittagong',
        deliveryCharge: 120,
        deliveryDays: '3-4 days',
        isActive: true,
      },
    }),
    prisma.zone.upsert({
      where: { name: 'Sylhet' },
      update: {},
      create: {
        name: 'Sylhet',
        deliveryCharge: 150,
        deliveryDays: '4-5 days',
        isActive: true,
      },
    }),
    prisma.zone.upsert({
      where: { name: 'Rajshahi' },
      update: {},
      create: {
        name: 'Rajshahi',
        deliveryCharge: 150,
        deliveryDays: '4-5 days',
        isActive: true,
      },
    }),
  ])
  console.log(`✅ Created ${zones.length} zones`)

  console.log('📦 Creating medicine categories...')
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { name: 'Blood Pressure' },
      update: {},
      create: {
        name: 'Blood Pressure',
        slug: 'blood-pressure',
        description: 'Medicines for managing blood pressure and hypertension',
        isActive: true,
      },
    }),
    prisma.category.upsert({
      where: { name: 'Diabetes' },
      update: {},
      create: {
        name: 'Diabetes',
        slug: 'diabetes',
        description: 'Medicines for diabetes management and blood sugar control',
        isActive: true,
      },
    }),
    prisma.category.upsert({
      where: { name: 'Baby Care' },
      update: {},
      create: {
        name: 'Baby Care',
        slug: 'baby-care',
        description: 'Essential medicines and supplements for babies and infants',
        isActive: true,
      },
    }),
    prisma.category.upsert({
      where: { name: 'Pain Relief' },
      update: {},
      create: {
        name: 'Pain Relief',
        slug: 'pain-relief',
        description: 'Pain management and relief medicines',
        isActive: true,
      },
    }),
    prisma.category.upsert({
      where: { name: 'Vitamins & Supplements' },
      update: {},
      create: {
        name: 'Vitamins & Supplements',
        slug: 'vitamins-supplements',
        description: 'Essential vitamins and dietary supplements',
        isActive: true,
      },
    }),
    prisma.category.upsert({
      where: { name: 'Heart Health' },
      update: {},
      create: {
        name: 'Heart Health',
        slug: 'heart-health',
        description: 'Medicines for cardiovascular health',
        isActive: true,
      },
    }),
  ])
  console.log(`✅ Created ${categories.length} categories`)

  console.log('💳 Creating membership plan...')
  const membershipPlan = await prisma.membershipPlan.upsert({
    where: { name: 'Monthly Membership' },
    update: {},
    create: {
      name: 'Monthly Membership',
      description: 'Get 10% discount on all medicines for 30 days',
      price: 100,
      durationDays: 30,
      discountPercent: 10,
      isActive: true,
    },
  })
  console.log(`✅ Created membership plan: ${membershipPlan.name}`)

  console.log('📋 Creating subscription plans...')
  
  const bpCarePlan = await prisma.subscriptionPlan.upsert({
    where: { slug: 'bp-care-package' },
    update: {
      shortDescription: 'রক্তচাপ নিয়ন্ত্রণ প্যাকেজ — প্রয়োজনীয় ওষুধ ও ফলোআপ।',
      itemsSummary:
        'রক্তচাপ নিয়ন্ত্রণে প্রয়োজনীয় ওষুধ\nনিয়মিত ফলোআপ ও রিফিল সুবিধা\nহৃদস্বাস্থ্য সংক্রান্ত নির্দেশনা',
      sortOrder: 3,
    },
    create: {
      name: 'BP Care Package',
      slug: 'bp-care-package',
      shortDescription: 'রক্তচাপ নিয়ন্ত্রণ প্যাকেজ — প্রয়োজনীয় ওষুধ ও ফলোআপ।',
      itemsSummary:
        'রক্তচাপ নিয়ন্ত্রণে প্রয়োজনীয় ওষুধ\nনিয়মিত ফলোআপ ও রিফিল সুবিধা\nহৃদস্বাস্থ্য সংক্রান্ত নির্দেশনা',
      priceMonthly: 1500,
      sortOrder: 3,
      isActive: true,
    },
  })

  const diabetesPlan = await prisma.subscriptionPlan.upsert({
    where: { slug: 'diabetes-care-package' },
    update: {
      shortDescription: 'ডায়াবেটিস ম্যানেজমেন্ট — ওষুধ ও নিয়মিত সাপোর্ট।',
      itemsSummary:
        'ডায়াবেটিস পরিচালনার মূল ওষুধসমূহ\nসাপ্লিমেন্ট ও ব্লাড সুগার সাপোর্ট\nনিয়মিত সরবরাহ নিশ্চিত',
      sortOrder: 4,
    },
    create: {
      name: 'Diabetes Care Package',
      slug: 'diabetes-care-package',
      shortDescription: 'ডায়াবেটিস ম্যানেজমেন্ট — ওষুধ ও নিয়মিত সাপোর্ট।',
      itemsSummary:
        'ডায়াবেটিস পরিচালনার মূল ওষুধসমূহ\nসাপ্লিমেন্ট ও ব্লাড সুগার সাপোর্ট\nনিয়মিত সরবরাহ নিশ্চিত',
      priceMonthly: 2000,
      sortOrder: 4,
      isActive: true,
    },
  })

  const babyCarePlan = await prisma.subscriptionPlan.upsert({
    where: { slug: 'baby-care-package' },
    update: {
      shortDescription: 'শিশুর জন্য প্রয়োজনীয় ওষুধ ও ভিটামিন।',
      itemsSummary:
        'শিশুর জন্য নিরাপদ ওষুধ ও ভিটামিন\nপেডিয়াট্রিক ডোজ ও ব্যবহার নির্দেশিকা\nবৃদ্ধি ও রোগ প্রতিরোধ ক্ষমতায় সহায়তা',
      sortOrder: 2,
      isFeatured: true,
    },
    create: {
      name: 'Baby Care Package',
      slug: 'baby-care-package',
      shortDescription: 'শিশুর জন্য প্রয়োজনীয় ওষুধ ও ভিটামিন।',
      itemsSummary:
        'শিশুর জন্য নিরাপদ ওষুধ ও ভিটামিন\nপেডিয়াট্রিক ডোজ ও ব্যবহার নির্দেশিকা\nবৃদ্ধি ও রোগ প্রতিরোধ ক্ষমতায় সহায়তা',
      priceMonthly: 1200,
      sortOrder: 2,
      isFeatured: true,
      isActive: true,
    },
  })

  const familyPlan = await prisma.subscriptionPlan.upsert({
    where: { slug: 'family-pack' },
    update: {
      shortDescription: 'পারিবারিক স্বাস্থ্য প্যাকেজ — সব বয়সের জন্য।',
      itemsSummary:
        'সব বয়সের জন্য প্রয়োজনীয় ওষুধ ও সাপ্লিমেন্ট\nমাসিক রিফিল ও ডেলিভারি রিমাইন্ডার\nপরিবারের জন্য বিশেষ মূল্য ও ছাড়',
      sortOrder: 1,
    },
    create: {
      name: 'Family Pack',
      slug: 'family-pack',
      shortDescription: 'পারিবারিক স্বাস্থ্য প্যাকেজ — সব বয়সের জন্য।',
      itemsSummary:
        'সব বয়সের জন্য প্রয়োজনীয় ওষুধ ও সাপ্লিমেন্ট\nমাসিক রিফিল ও ডেলিভারি রিমাইন্ডার\nপরিবারের জন্য বিশেষ মূল্য ও ছাড়',
      priceMonthly: 3500,
      sortOrder: 1,
      isActive: true,
    },
  })

  console.log('✅ Created 4 subscription plans')

  console.log('💊 Creating sample medicines...')
  const bpCategory = categories.find(c => c.name === 'Blood Pressure')
  const diabetesCategory = categories.find(c => c.name === 'Diabetes')
  const babyCareCategory = categories.find(c => c.name === 'Baby Care')
  const vitaminCategory = categories.find(c => c.name === 'Vitamins & Supplements')

  const medicines = await Promise.all([
    prisma.medicine.create({
      data: {
        name: 'Amlodipine 5mg',
        slug: 'amlodipine-5mg',
        genericName: 'Amlodipine',
        manufacturer: 'Square Pharmaceuticals Ltd.',
        description: 'Used to treat high blood pressure and chest pain',
        price: 150,
        sellingPrice: 150,
        stockQuantity: 500,
        categoryId: bpCategory!.id,
        requiresPrescription: true,
        isActive: true,
      },
    }).catch(() => prisma.medicine.findFirst({ where: { name: 'Amlodipine 5mg' } })),
    prisma.medicine.create({
      data: {
        name: 'Losartan 50mg',
        slug: 'losartan-50mg',
        genericName: 'Losartan',
        manufacturer: 'Incepta Pharmaceuticals Ltd.',
        description: 'Blood pressure medication',
        price: 180,
        sellingPrice: 180,
        stockQuantity: 400,
        categoryId: bpCategory!.id,
        requiresPrescription: true,
        isActive: true,
      },
    }).catch(() => prisma.medicine.findFirst({ where: { name: 'Losartan 50mg' } })),
    prisma.medicine.create({
      data: {
        name: 'Metformin 500mg',
        slug: 'metformin-500mg',
        genericName: 'Metformin',
        manufacturer: 'Square Pharmaceuticals Ltd.',
        description: 'Used to control blood sugar levels in type 2 diabetes',
        price: 120,
        sellingPrice: 120,
        stockQuantity: 600,
        categoryId: diabetesCategory!.id,
        requiresPrescription: true,
        isActive: true,
      },
    }).catch(() => prisma.medicine.findFirst({ where: { name: 'Metformin 500mg' } })),
    prisma.medicine.create({
      data: {
        name: 'Glimepiride 2mg',
        slug: 'glimepiride-2mg',
        genericName: 'Glimepiride',
        manufacturer: 'Beximco Pharmaceuticals Ltd.',
        description: 'Diabetes medication to control blood sugar',
        price: 200,
        sellingPrice: 200,
        stockQuantity: 300,
        categoryId: diabetesCategory!.id,
        requiresPrescription: true,
        isActive: true,
      },
    }).catch(() => prisma.medicine.findFirst({ where: { name: 'Glimepiride 2mg' } })),
    prisma.medicine.create({
      data: {
        name: 'Baby Vitamin D Drops',
        slug: 'baby-vitamin-d-drops',
        genericName: 'Cholecalciferol',
        manufacturer: 'Renata Limited',
        description: 'Essential vitamin D supplement for babies',
        price: 250,
        sellingPrice: 250,
        stockQuantity: 200,
        categoryId: babyCareCategory!.id,
        requiresPrescription: false,
        isActive: true,
      },
    }).catch(() => prisma.medicine.findFirst({ where: { name: 'Baby Vitamin D Drops' } })),
    prisma.medicine.create({
      data: {
        name: 'Gripe Water',
        slug: 'gripe-water',
        genericName: 'Herbal Digestive',
        manufacturer: 'Woodwards',
        description: 'Relief from colic and gas in babies',
        price: 180,
        sellingPrice: 180,
        stockQuantity: 250,
        categoryId: babyCareCategory!.id,
        requiresPrescription: false,
        isActive: true,
      },
    }).catch(() => prisma.medicine.findFirst({ where: { name: 'Gripe Water' } })),
    prisma.medicine.create({
      data: {
        name: 'Multivitamin Tablets',
        slug: 'multivitamin-tablets',
        genericName: 'Multivitamin',
        manufacturer: 'Beximco Pharmaceuticals Ltd.',
        description: 'Complete daily vitamin supplement',
        price: 300,
        sellingPrice: 300,
        stockQuantity: 400,
        categoryId: vitaminCategory!.id,
        requiresPrescription: false,
        isActive: true,
      },
    }).catch(() => prisma.medicine.findFirst({ where: { name: 'Multivitamin Tablets' } })),
  ].map(p => p.then(m => m!)))
  console.log(`✅ Created ${medicines.length} sample medicines`)

  console.log('✅ Subscription plans created (items managed via itemsSummary field)')

  console.log('🎨 Creating banner placeholders...')
  const banners = await Promise.all([
    prisma.banner.create({
      data: {
        title: 'Welcome to HealthPlus',
        description: 'Get 10% discount with membership',
        imageUrl: '/banners/welcome.jpg',
        link: '/membership',
        location: 'HOME_HERO',
        order: 1,
        isActive: true,
      },
    }).catch(() => null),
    prisma.banner.create({
      data: {
        title: 'Subscribe to Monthly Packages',
        description: 'BP Care, Diabetes, Baby Care & Family Pack',
        imageUrl: '/banners/subscriptions.jpg',
        link: '/subscriptions',
        location: 'HOME_MID',
        order: 1,
        isActive: true,
      },
    }).catch(() => null),
    prisma.banner.create({
      data: {
        title: 'Upload Your Prescription',
        description: 'We will call you back shortly',
        imageUrl: '/banners/prescription.jpg',
        link: '/',
        location: 'HOME_MID',
        order: 2,
        isActive: true,
      },
    }).catch(() => null),
  ])
  console.log(`✅ Created ${banners.length} banners`)

  console.log('👤 Creating default admin user...')
  const adminPhone = process.env.DEFAULT_ADMIN_PHONE || '+8801712345678'
  const adminPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'ChangeMe123!'
  const adminName = process.env.DEFAULT_ADMIN_NAME || 'Admin User'
  const adminEmail = process.env.DEFAULT_ADMIN_EMAIL || 'admin@healthplus.com'

  const hashedPassword = await hash(adminPassword, 10)

  const adminUser = await prisma.user.upsert({
    where: { phone: adminPhone },
    update: {},
    create: {
      phone: adminPhone,
      password: hashedPassword,
      name: adminName,
      email: adminEmail,
      role: 'ADMIN',
    },
  })
  console.log(`✅ Created admin user: ${adminUser.name} (${adminUser.phone})`)

  console.log('\n🎉 Database seed completed successfully!')
  console.log('\n📊 Summary:')
  console.log(`   - ${zones.length} delivery zones`)
  console.log(`   - ${categories.length} medicine categories`)
  console.log(`   - 1 membership plan (100 BDT, 10% discount)`)
  console.log(`   - 4 subscription plans (BP, Diabetes, Baby Care, Family Pack)`)
  console.log(`   - ${medicines.length} sample medicines`)
  console.log(`   - ${banners.length} banner placeholders`)
  console.log(`   - 1 admin user`)
  console.log('\n⚠️  IMPORTANT: Change the default admin password after first login!')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
