'use client'

import { useEffect } from 'react'
import { X, Upload } from 'lucide-react'
import PrescriptionUploadForm from '@/components/PrescriptionUploadForm'

interface PrescriptionUploadModalProps {
  isOpen: boolean
  onClose: () => void
}

export function PrescriptionUploadModal({ isOpen, onClose }: PrescriptionUploadModalProps) {
  // Handle Escape key to close modal
  useEffect(() => {
    if (!isOpen) return

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  // Lock body scroll when modal is open
  useEffect(() => {
    if (!isOpen) return

    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = originalOverflow
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="prescription-modal-title"
        className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-5 shadow-xl sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with close button */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-100">
              <Upload className="h-5 w-5 text-teal-600" />
            </div>
            <h2 id="prescription-modal-title" className="text-lg font-bold text-gray-900">
              প্রেসক্রিপশন আপলোড করুন
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Prescription Upload Form - hide header since modal has its own */}
        <PrescriptionUploadForm hideHeader compact />
      </div>
    </div>
  )
}
