import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Start seeding...')

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 12)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@healthplus.com' },
    update: {},
    create: {
      email: 'admin@healthplus.com',
      name: 'Admin User',
      password: adminPassword,
      role: 'ADMIN',
      phone: '+880123456789',
      address: 'Dhaka, Bangladesh',
    },
  })
  console.log('Created admin user:', admin)

  // Create customer user
  const customerPassword = await bcrypt.hash('customer123', 12)
  const customer = await prisma.user.upsert({
    where: { email: 'customer@example.com' },
    update: {},
    create: {
      email: 'customer@example.com',
      name: 'John Doe',
      password: customerPassword,
      role: 'CUSTOMER',
      phone: '+880987654321',
      address: 'Chittagong, Bangladesh',
    },
  })
  console.log('Created customer user:', customer)

  // Create medicine plans
  const bpPlan = await prisma.medicinePlan.create({
    data: {
      name: 'Blood Pressure Management Plan',
      description: 'Complete monthly package for BP control and monitoring',
      type: 'BP_MONTHLY',
      price: 1500,
      duration: 30,
      medicines: [
        'Amlodipine 5mg',
        'Losartan 50mg',
        'Hydrochlorothiazide 25mg',
        'Blood Pressure Monitor Strips',
      ],
    },
  })

  const diabetesPlan = await prisma.medicinePlan.create({
    data: {
      name: 'Diabetes Care Plan',
      description: 'Comprehensive monthly diabetes management package',
      type: 'DIABETES_MONTHLY',
      price: 2000,
      duration: 30,
      medicines: [
        'Metformin 500mg',
        'Glimepiride 2mg',
        'Insulin Glargine',
        'Glucose Test Strips',
        'Lancets',
      ],
    },
  })

  const heartPlan = await prisma.medicinePlan.create({
    data: {
      name: 'Heart Health Plan',
      description: 'Monthly plan for cardiovascular health',
      type: 'HEART_MONTHLY',
      price: 1800,
      duration: 30,
      medicines: [
        'Atorvastatin 20mg',
        'Aspirin 75mg',
        'Clopidogrel 75mg',
        'Omega-3 Supplements',
      ],
    },
  })

  console.log('Created medicine plans')

  // Create medicines
  const medicines = [
    { name: 'Paracetamol 500mg', description: 'Pain relief and fever reducer', price: 50, stock: 1000, category: 'Pain Relief' },
    { name: 'Amoxicillin 500mg', description: 'Antibiotic for bacterial infections', price: 120, stock: 500, category: 'Antibiotics' },
    { name: 'Omeprazole 20mg', description: 'Reduces stomach acid', price: 80, stock: 750, category: 'Gastric' },
    { name: 'Cetirizine 10mg', description: 'Antihistamine for allergies', price: 40, stock: 800, category: 'Allergy' },
    { name: 'Vitamin D3', description: 'Vitamin D supplement', price: 200, stock: 300, category: 'Vitamins' },
    { name: 'Multivitamin', description: 'Daily multivitamin supplement', price: 250, stock: 400, category: 'Vitamins' },
    { name: 'Insulin Syringe', description: 'Disposable insulin syringes', price: 150, stock: 200, category: 'Diabetes' },
    { name: 'Blood Glucose Meter', description: 'Digital blood glucose monitor', price: 1500, stock: 50, category: 'Medical Devices' },
  ]

  for (const med of medicines) {
    await prisma.medicine.create({ data: med })
  }
  console.log('Created medicines')

  // Create a sample subscription for the customer
  const subscription = await prisma.subscription.create({
    data: {
      userId: customer.id,
      planId: diabetesPlan.id,
      status: 'ACTIVE',
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    },
  })
  console.log('Created sample subscription')

  // Create a sample membership for the customer
  const membership = await prisma.membership.create({
    data: {
      userId: customer.id,
      status: 'ACTIVE',
      price: 100,
      discount: 10,
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    },
  })
  console.log('Created sample membership')

  console.log('Seeding finished.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
