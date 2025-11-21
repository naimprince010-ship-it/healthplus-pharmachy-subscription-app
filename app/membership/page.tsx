import { Shield, Check } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'

async function getMembershipPlans() {
  try {
    return await prisma.membershipPlan.findMany({
      where: { isActive: true },
      orderBy: { price: 'asc' },
    })
  } catch {
    return []
  }
}

export default async function MembershipPage() {
  const plans = await getMembershipPlans()

  return (
    <div className="bg-white py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900">Membership Plans</h1>
          <p className="mt-4 text-lg text-gray-600">
            Join our membership program and save on all your medicine purchases
          </p>
        </div>

        <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className="rounded-2xl border-2 border-gray-200 bg-white p-8 shadow-lg transition-transform hover:scale-105"
            >
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-teal-100">
                <Shield className="h-8 w-8 text-teal-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">{plan.name}</h2>
              <p className="mt-2 text-gray-600">{plan.description}</p>
              <div className="mt-6 flex items-baseline space-x-2">
                <span className="text-5xl font-bold text-gray-900">৳{plan.price}</span>
                <span className="text-xl text-gray-600">/{plan.durationDays} days</span>
              </div>
              <ul className="mt-8 space-y-4">
                <li className="flex items-start">
                  <Check className="mr-3 h-5 w-5 flex-shrink-0 text-teal-600" />
                  <span className="text-gray-700">{plan.discountPercent}% discount on all medicines</span>
                </li>
                <li className="flex items-start">
                  <Check className="mr-3 h-5 w-5 flex-shrink-0 text-teal-600" />
                  <span className="text-gray-700">Valid for {plan.durationDays} days</span>
                </li>
                <li className="flex items-start">
                  <Check className="mr-3 h-5 w-5 flex-shrink-0 text-teal-600" />
                  <span className="text-gray-700">Priority customer support</span>
                </li>
                <li className="flex items-start">
                  <Check className="mr-3 h-5 w-5 flex-shrink-0 text-teal-600" />
                  <span className="text-gray-700">Free delivery on orders above ৳500</span>
                </li>
              </ul>
              <Link
                href="/dashboard"
                className="mt-8 block w-full rounded-lg bg-teal-600 py-3 text-center font-semibold text-white transition-colors hover:bg-teal-700"
              >
                Join Now
              </Link>
            </div>
          ))}
        </div>

        <div className="mt-16 rounded-2xl bg-teal-50 p-8">
          <h2 className="text-2xl font-bold text-gray-900">How It Works</h2>
          <div className="mt-8 grid gap-8 md:grid-cols-3">
            <div>
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-teal-600 text-xl font-bold text-white">
                1
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Choose Your Plan</h3>
              <p className="mt-2 text-gray-600">Select the membership plan that best fits your needs</p>
            </div>
            <div>
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-teal-600 text-xl font-bold text-white">
                2
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Make Payment</h3>
              <p className="mt-2 text-gray-600">Complete your payment securely through our platform</p>
            </div>
            <div>
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-teal-600 text-xl font-bold text-white">
                3
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Start Saving</h3>
              <p className="mt-2 text-gray-600">Enjoy your discount on all medicine purchases immediately</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
