'use client'

import { useState } from 'react'
import { FileText } from 'lucide-react'
import { PrescriptionUploadModal } from './PrescriptionUploadModal'

export function PrescriptionUploadCard() {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <>
      {/* MedEasy-style compact prescription card */}
      <div className="rounded-xl bg-teal-50 p-6 text-center">
        {/* Icon */}
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center">
          <div className="relative">
            <FileText className="h-12 w-12 text-teal-600" />
            <div className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-teal-600 text-white">
              <span className="text-xs">+</span>
            </div>
          </div>
        </div>

        {/* Title */}
        <h3 className="text-lg font-bold text-teal-700">
          প্রেসক্রিপশন দিয়ে ওষুধ অর্ডার করুন!
        </h3>

        {/* Description */}
        <p className="mt-2 text-sm text-gray-600">
          আপনার প্রেসক্রিপশনের ছবি আপলোড করুন, আমরা ওষুধ পৌঁছে দেব আপনার ঠিকানায়।
        </p>

        {/* Upload Button */}
        <button
          onClick={() => setIsModalOpen(true)}
          className="mt-4 rounded-full bg-teal-600 px-8 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-700"
        >
          Upload
        </button>
      </div>

      {/* Modal */}
      <PrescriptionUploadModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  )
}
