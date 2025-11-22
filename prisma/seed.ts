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
    where: { name: 'BP Care Package' },
    update: {},
    create: {
      name: 'BP Care Package',
      slug: 'bp-care-package',
      description: 'Monthly blood pressure management package with essential medicines',
      price: 1500,
      durationDays: 30,
      isActive: true,
    },
  })

  const diabetesPlan = await prisma.subscriptionPlan.upsert({
    where: { name: 'Diabetes Care Package' },
    update: {},
    create: {
      name: 'Diabetes Care Package',
      slug: 'diabetes-care-package',
      description: 'Complete diabetes management package with medications and supplements',
      price: 2000,
      durationDays: 30,
      isActive: true,
    },
  })

  const babyCarePlan = await prisma.subscriptionPlan.upsert({
    where: { name: 'Baby Care Package' },
    update: {},
    create: {
      name: 'Baby Care Package',
      slug: 'baby-care-package',
      description: 'Essential baby care medicines and supplements for healthy growth',
      price: 1200,
      durationDays: 30,
      isActive: true,
    },
  })

  const familyPlan = await prisma.subscriptionPlan.upsert({
    where: { name: 'Family Pack' },
    update: {},
    create: {
      name: 'Family Pack',
      slug: 'family-pack',
      description: 'Comprehensive family health package with essential medicines for all ages',
      price: 3500,
      durationDays: 30,
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

  console.log('🔗 Linking medicines to subscription plans...')
  
  await prisma.subscriptionItem.createMany({
    data: [
      {
        planId: bpCarePlan.id,
        medicineId: medicines[0].id, // Amlodipine
        quantity: 30,
      },
      {
        planId: bpCarePlan.id,
        medicineId: medicines[1].id, // Losartan
        quantity: 30,
      },
    ],
    skipDuplicates: true,
  })

  await prisma.subscriptionItem.createMany({
    data: [
      {
        planId: diabetesPlan.id,
        medicineId: medicines[2].id, // Metformin
        quantity: 60,
      },
      {
        planId: diabetesPlan.id,
        medicineId: medicines[3].id, // Glimepiride
        quantity: 30,
      },
    ],
    skipDuplicates: true,
  })

  await prisma.subscriptionItem.createMany({
    data: [
      {
        planId: babyCarePlan.id,
        medicineId: medicines[4].id, // Vitamin D Drops
        quantity: 1,
      },
      {
        planId: babyCarePlan.id,
        medicineId: medicines[5].id, // Gripe Water
        quantity: 2,
      },
    ],
    skipDuplicates: true,
  })

  await prisma.subscriptionItem.createMany({
    data: [
      {
        planId: familyPlan.id,
        medicineId: medicines[6].id, // Multivitamin
        quantity: 60,
      },
      {
        planId: familyPlan.id,
        medicineId: medicines[4].id, // Vitamin D Drops
        quantity: 1,
      },
    ],
    skipDuplicates: true,
  })

  console.log('✅ Linked medicines to subscription plans')

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
