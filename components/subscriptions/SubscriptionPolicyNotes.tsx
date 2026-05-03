interface SubscriptionPolicyNotesProps {
  variant?: 'landing' | 'detail'
}

const DELIVERY_COPY =
  'প্রতিটি চক্রের জন্য ডেলিভারি সাধারণত মাসের প্রথম সপ্তাহে নির্ধারিত হয়। কাট-অফ ও নির্দিষ্ট তারিখ সাপোর্ট টিম কল করে নিশ্চিত করা যাবে। প্রথম ডেলিভারি শুরুর পর থেকে সাধারণত ৫–১০ কর্মদিবসের মধ্যে।'

const CANCEL_COPY =
  'সাবস্ক্রিপশন যেকোনো সময় বাতিল করতে পারবেন। বাতিলের পরও ইতিমধ্যে নিশ্চিত ডেলিভারি সংক্রান্ত বিষয়ে টিম থেকে পরিষ্কার বিজ্ঞপ্তি পাবেন।'

/** Shared delivery / cancellation copy for subscriptions flows. */
export function SubscriptionPolicyNotes({ variant = 'detail' }: SubscriptionPolicyNotesProps) {
  const box =
    variant === 'detail'
      ? 'rounded-2xl border border-teal-100 bg-teal-50/50 p-5 sm:p-6'
      : 'rounded-xl border border-gray-100 bg-white/90 p-4'

  return (
    <div className={`grid gap-4 md:grid-cols-2 ${box}`}>
      <div>
        <h3 className="font-bold text-gray-900">ডেলিভারি সময়সূচি</h3>
        <p className="mt-2 text-sm leading-relaxed text-gray-700">{DELIVERY_COPY}</p>
      </div>
      <div>
        <h3 className="font-bold text-gray-900">বাতিল ও নীতি</h3>
        <p className="mt-2 text-sm leading-relaxed text-gray-700">{CANCEL_COPY}</p>
      </div>
    </div>
  )
}
