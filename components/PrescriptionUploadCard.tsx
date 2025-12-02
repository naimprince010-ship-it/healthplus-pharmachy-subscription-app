'use client'

import { useState } from 'react'
import { FileText, Plus } from 'lucide-react'
import { PrescriptionUploadModal } from './PrescriptionUploadModal'

export function PrescriptionUploadCard() {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <>
      {/* Modern prescription upload card */}
      <div className="rounded-2xl bg-white p-6 text-center shadow-md border border-gray-100">
        {/* Icon */}
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center">
          <div className="relative">
            <svg 
              className="h-12 w-12 text-teal-600" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="1.5"
            >
              <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M13 3v5a1 1 0 001 1h5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-teal-600 text-white">
              <Plus className="h-3 w-3" />
            </div>
          </div>
        </div>

        {/* Title */}
        <h3 className="text-lg font-bold text-gray-900">
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
