import Link from 'next/link'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'ফ্রি হেলথ টুলস | Halalzi',
  description: 'ফ্রি BMI ক্যালকুলেটর, প্রেগন্যান্সি ডিউ ডেট ক্যালকুলেটর, ডায়াবেটিস চেকার সহ আরও অনেক টুল। আপনার স্বাস্থ্য সহজে ট্র্যাক করুন।',
}

export default function ToolsPage() {
  const tools = [
    {
      title: 'BMI Calculator',
      titleBn: 'বিএমআই ক্যালকুলেটর',
      description: 'আপনার উচ্চতা অনুযায়ী ওজন ঠিক আছে কিনা জানুন',
      href: '/tools/bmi-calculator',
      icon: <span className="text-3xl">⚖️</span>,
      gradient: 'from-teal-500 to-emerald-500',
      shadowColor: 'shadow-teal-200',
      bgLight: 'bg-teal-50',
    },
    {
      title: 'Pregnancy Calculator',
      titleBn: 'প্রেগন্যান্সি ক্যালকুলেটর',
      description: 'সম্ভাব্য প্রসবের তারিখ এবং বর্তমান ট্রাইমেস্টার জানুন',
      href: '/tools/pregnancy-calculator',
      icon: <span className="text-3xl">👶</span>,
      gradient: 'from-pink-400 to-rose-500',
      shadowColor: 'shadow-pink-200',
      bgLight: 'bg-pink-50',
    },
    {
      title: 'Diabetes Checker',
      titleBn: 'ডায়াবেটিস চেকার',
      description: 'আপনার রক্তে শর্করার মাত্রা স্বাভাবিক কিনা দেখুন',
      href: '/tools/diabetes-checker',
      icon: <span className="text-3xl">🩸</span>,
      gradient: 'from-blue-500 to-indigo-500',
      shadowColor: 'shadow-blue-200',
      bgLight: 'bg-blue-50',
    },
    {
      title: 'Water Calculator',
      titleBn: 'পানির হিসাব',
      description: 'প্রতিদিন আপনার কতটুকু পানি পান করা উচিত তা জানুন',
      href: '/tools/water-intake-calculator',
      icon: <span className="text-3xl">💧</span>,
      gradient: 'from-cyan-400 to-blue-500',
      shadowColor: 'shadow-cyan-200',
      bgLight: 'bg-cyan-50',
    },
    {
      title: 'Calorie Calculator',
      titleBn: 'ক্যালরি ক্যালকুলেটর',
      description: 'দৈনিক কত ক্যালরি প্রয়োজন তার হিসাব করুন',
      href: '/tools/calorie-calculator',
      icon: <span className="text-3xl">🔥</span>,
      gradient: 'from-orange-400 to-red-500',
      shadowColor: 'shadow-orange-200',
      bgLight: 'bg-orange-50',
    },
    {
      title: 'Blood Donation Tracker',
      titleBn: 'রক্তদান ট্র্যাকার',
      description: 'পরবর্তী রক্তদানের সম্ভাব্য তারিখ জানুন',
      href: '/tools/blood-donation-calculator',
      icon: <span className="text-3xl">❤️</span>,
      gradient: 'from-red-500 to-rose-700',
      shadowColor: 'shadow-red-200',
      bgLight: 'bg-red-50',
    },
    {
      title: 'Sleep Cycle Calculator',
      titleBn: 'স্লিপ সাইকেল ক্যালকুলেটর',
      description: 'সকালে ওঠার জন্য রাতে ঠিক কয়টায় ঘুমানো উচিত জানুন',
      href: '/tools/sleep-cycle-calculator',
      icon: <span className="text-3xl">🌙</span>,
      gradient: 'from-indigo-600 to-purple-700',
      shadowColor: 'shadow-indigo-200',
      bgLight: 'bg-indigo-50',
    },
    {
      title: 'Period Tracker',
      titleBn: 'পিরিয়ড ও ওভুলেশন ট্র্যাকার',
      description: 'পরবর্তী সাইকেল ও সন্তান ধারণের উপযুক্ত সময় জানুন',
      href: '/tools/period-tracker',
      icon: <span className="text-3xl">🌸</span>,
      gradient: 'from-rose-400 to-pink-600',
      shadowColor: 'shadow-rose-200',
      bgLight: 'bg-rose-50',
    },
    {
      title: 'Quit Smoking Tracker',
      titleBn: 'ধূমপান ছাড়ার হিসাব',
      description: 'ধূমপান ছাড়ার ফলে জমানো টাকা ও স্বাস্থ্যের উন্নতি দেখুন',
      href: '/tools/smoking-calculator',
      icon: <span className="text-3xl">🚭</span>,
      gradient: 'from-slate-600 to-gray-800',
      shadowColor: 'shadow-slate-200',
      bgLight: 'bg-slate-50',
    },
  ]

  return (
    <div className="min-h-[calc(100vh-4rem)]">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-teal-600 via-teal-500 to-emerald-500 py-16 px-4 text-center text-white">
        <div className="max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-full px-4 py-1.5 text-sm font-medium mb-6">
            <span className="w-2 h-2 bg-emerald-300 rounded-full animate-pulse" />
            ১০০% ফ্রি • কোনো রেজিস্ট্রেশন লাগবে না
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
            ফ্রি হেলথ টুলস
          </h1>
          <p className="mt-4 text-lg text-teal-100 max-w-xl mx-auto">
            আপনার স্বাস্থ্যের গুরুত্বপূর্ণ তথ্য জানুন — দ্রুত, সহজ, এবং সম্পূর্ণ বিনামূল্যে
          </p>
        </div>
      </div>

      {/* Tools Grid */}
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 -mt-8 pb-16">
        <div className="grid gap-6 md:grid-cols-3">
          {tools.map((tool) => (
            <Link
              key={tool.href}
              href={tool.href}
              className="group block bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden border border-gray-100"
            >
              {/* Gradient Top */}
              <div className={`h-2 bg-gradient-to-r ${tool.gradient}`} />
              
              <div className="p-6 flex flex-col h-full">
                {/* Icon */}
                <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl ${tool.bgLight} mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  {tool.icon}
                </div>

                <div className="flex-grow">
                  <h2 className="text-lg font-bold text-gray-900">{tool.title}</h2>
                  <p className="text-xs text-gray-400 font-medium">{tool.titleBn}</p>
                  <p className="text-sm text-gray-500 mt-2 leading-relaxed">{tool.description}</p>
                </div>

                {/* CTA */}
                <div className={`mt-5 inline-flex items-center gap-2 text-sm font-bold bg-gradient-to-r ${tool.gradient} bg-clip-text text-transparent group-hover:gap-3 transition-all`}>
                  ব্যবহার করুন
                  <svg className="w-4 h-4 text-teal-500 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Trust Badges */}
        <div className="mt-12 flex flex-wrap justify-center gap-6 text-sm text-gray-400">
          <div className="flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span>তথ্য সুরক্ষিত</span>
          </div>
          <div className="flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span>ইন্সট্যান্ট রেজাল্ট</span>
          </div>
          <div className="flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08-.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>সম্পূর্ণ ফ্রি</span>
          </div>
        </div>
      </div>
    </div>
  )
}
