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
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 px-4 transition-all duration-300 backdrop-blur-sm"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="prescription-modal-title"
        className="relative flex w-full max-w-xl max-h-[90vh] flex-col overflow-hidden rounded-[24px] bg-white shadow-2xl transition-all duration-300 animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with close button - Fixed at top */}
        <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/50 p-5 sm:px-8">
          <div className="flex items-center space-x-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-600 shadow-lg shadow-teal-500/20">
              <Upload className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 id="prescription-modal-title" className="text-xl font-extrabold text-gray-900 tracking-tight">
                প্রেসক্রিপশন আপলোড করুন
              </h2>
              <p className="text-xs font-medium text-gray-500">দ্রুত অর্ডার কনফার্ম করতে সাহায্য করুন</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="group rounded-full bg-white p-2 text-gray-400 shadow-sm ring-1 ring-gray-200 transition-all hover:bg-red-50 hover:text-red-500 hover:ring-red-100"
            aria-label="Close modal"
          >
            <X className="h-5 w-5 transition-transform group-hover:rotate-90" />
          </button>
        </div>

        {/* Scrollable Content Area - strictly limited height */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-8" style={{ maxHeight: 'calc(85vh - 100px)' }}>
          {/* Prescription Upload Form - hide header since modal has its own */}
          <PrescriptionUploadForm hideHeader compact />
          <div className="h-2" />
        </div>
      </div>
    </div>
  )
}
