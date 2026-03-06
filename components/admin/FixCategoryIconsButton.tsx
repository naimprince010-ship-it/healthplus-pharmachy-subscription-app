'use client'

import { useState } from 'react'
import { Sparkles, Loader2, Image as ImageIcon } from 'lucide-react'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'

export default function FixCategoryIconsButton() {
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()

    const handleFixIcons = async () => {
        if (!confirm('Are you sure you want to auto-apply premium icons to matching categories? This will overwrite existing sidebar icons for those categories.')) {
            return
        }

        setIsLoading(true)
        try {
            const res = await fetch('/api/admin/categories/fix-icons', {
                method: 'POST',
            })

            const data = await res.json()

            if (res.ok) {
                toast.success(data.message || 'Icons updated successfully!')
                router.refresh()
            } else {
                toast.error(data.error || 'Failed to update icons')
            }
        } catch (error) {
            toast.error('An error occurred while updating icons')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <button
            onClick={handleFixIcons}
            disabled={isLoading}
            className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50 transition-all shadow-sm hover:shadow-md"
            title="Auto-apply premium 3D icons to standard categories"
        >
            {isLoading ? (
                <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Updating...
                </>
            ) : (
                <>
                    <ImageIcon className="h-4 w-4" />
                    <span>Auto-Fix Sidebar Icons</span>
                </>
            )}
        </button>
    )
}
