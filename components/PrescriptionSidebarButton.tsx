'use client'

import { useState } from 'react'
import { Upload, ChevronRight } from 'lucide-react'
import { PrescriptionUploadModal } from './PrescriptionUploadModal'

export default function PrescriptionSidebarButton() {
    const [isModalOpen, setIsModalOpen] = useState(false)

    return (
        <>
            <PrescriptionUploadModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />

            <button
                onClick={() => setIsModalOpen(true)}
                className="group mb-4 flex w-full flex-col overflow-hidden rounded-xl border border-teal-100 bg-gradient-to-br from-teal-500 to-teal-600 p-4 text-left shadow-md transition-all duration-300 hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]"
            >
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm group-hover:bg-white/30 transition-colors">
                        <Upload className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-[15px] font-bold text-white">প্রেসক্রিপশন আপলোড</h3>
                        <p className="text-[11px] text-teal-50">দ্রুত অর্ডার কনফার্ম করুন</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-white/50 group-hover:text-white transition-colors" />
                </div>
            </button>
        </>
    )
}
