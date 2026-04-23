'use client'

import { useState } from 'react'
import { Upload, ChevronRight } from 'lucide-react'
import { PrescriptionUploadModal } from './PrescriptionUploadModal'

export default function PrescriptionSidebarButton() {
    const [isModalOpen, setIsModalOpen] = useState(false)

    return (
        <>
            <style>{`
                @keyframes pulse-ring {
                    0% { transform: scale(1); opacity: 0.6; }
                    70% { transform: scale(1.5); opacity: 0; }
                    100% { transform: scale(1.5); opacity: 0; }
                }
                @keyframes bounce-icon {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-3px); }
                }
                .prescription-btn .pulse-ring {
                    animation: pulse-ring 2s ease-out infinite;
                }
                .prescription-btn .upload-icon {
                    animation: bounce-icon 2s ease-in-out infinite;
                }
            `}</style>

            <PrescriptionUploadModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />

            <button
                onClick={() => setIsModalOpen(true)}
                className="prescription-btn group mb-4 flex w-full flex-col overflow-hidden rounded-xl border border-teal-100 bg-gradient-to-br from-teal-500 to-teal-600 p-4 text-left shadow-md transition-all duration-300 hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]"
            >
                <div className="flex items-center gap-3">
                    <div className="relative flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm group-hover:bg-white/30 transition-colors">
                        {/* Pulse ring */}
                        <span className="pulse-ring absolute inset-0 rounded-full bg-white/30" />
                        <Upload className="upload-icon h-5 w-5 text-white relative z-10" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-[15px] font-bold text-white">প্রেসক্রিপশন আপলোড</h3>
                        <p className="text-[11px] text-teal-50">দ্রুত অর্ডার কনফার্ম করুন</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-white/50 transition-all duration-300 group-hover:text-white group-hover:translate-x-0.5" />
                </div>
            </button>
        </>
    )
}
