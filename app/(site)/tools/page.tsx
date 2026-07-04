import Link from 'next/link'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Health Tools | HealthPlus',
  description: 'Free health calculators including BMI, Pregnancy Due Date, and Diabetes Checker. Use our tools to track your health easily.',
}

export default function ToolsPage() {
  const tools = [
    {
      title: 'BMI Calculator',
      description: 'Check if your weight is in a healthy range for your height.',
      href: '/tools/bmi-calculator',
      icon: '⚖️',
      color: 'bg-teal-50 border-teal-100 text-teal-700',
    },
    {
      title: 'Pregnancy Calculator',
      description: 'Calculate your estimated due date (EDD) and current trimester.',
      href: '/tools/pregnancy-calculator',
      icon: '👶',
      color: 'bg-pink-50 border-pink-100 text-pink-700',
    },
    {
      title: 'Diabetes Checker',
      description: 'Check if your blood sugar levels are within normal limits.',
      href: '/tools/diabetes-checker',
      icon: '🩸',
      color: 'bg-blue-50 border-blue-100 text-blue-700',
    }
  ]

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="text-center max-w-3xl mx-auto mb-12">
        <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">Free Health Tools</h1>
        <p className="mt-4 text-xl text-gray-500">
          Use our free calculators to stay on top of your health metrics. Quick, easy, and completely free.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto">
        {tools.map((tool) => (
          <Link 
            key={tool.href} 
            href={tool.href}
            className={`block p-6 rounded-2xl border ${tool.color} hover:shadow-md transition-all hover:-translate-y-1`}
          >
            <div className="text-4xl mb-4">{tool.icon}</div>
            <h2 className="text-xl font-bold mb-2">{tool.title}</h2>
            <p className="text-sm opacity-80">{tool.description}</p>
            <div className="mt-6 flex items-center text-sm font-semibold">
              Use Tool
              <svg className="ml-2 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
