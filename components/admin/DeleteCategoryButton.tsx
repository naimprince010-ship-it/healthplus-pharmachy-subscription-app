'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'

interface DeleteCategoryButtonProps {
  categoryId: string
  categoryName: string
  medicineCount: number
  subCategoryCount: number
}

export default function DeleteCategoryButton({
  categoryId,
  categoryName,
  medicineCount,
  subCategoryCount,
}: DeleteCategoryButtonProps) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [showForceConfirm, setShowForceConfirm] = useState(false)

  const handleDelete = async (force = false) => {
    setIsDeleting(true)
    try {
      const url = force
        ? `/api/admin/categories/${categoryId}?force=true`
        : `/api/admin/categories/${categoryId}`

      const response = await fetch(url, {
        method: 'DELETE',
        credentials: 'include',
      })

      const data = await response.json()

      if (!response.ok) {
        if (data.canForceDelete && !force) {
          setShowConfirm(false)
          setShowForceConfirm(true)
          setIsDeleting(false)
          return
        }
        alert(data.error || 'Failed to delete category')
        setIsDeleting(false)
        return
      }

      router.refresh()
      setShowConfirm(false)
      setShowForceConfirm(false)
    } catch (error) {
      console.error('Error deleting category:', error)
      alert('Failed to delete category')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        className="text-red-600 hover:text-red-700"
        disabled={isDeleting}
      >
        <Trash2 className="h-4 w-4" />
      </button>

      {/* Initial Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">
              Delete Category
            </h3>
            <p className="mb-6 text-sm text-gray-600">
              Are you sure you want to delete the category &quot;{categoryName}&quot;?
              {medicineCount > 0 && (
                <span className="mt-2 block font-medium text-orange-600">
                  Warning: This category has {medicineCount} medicine(s) associated with it.
                </span>
              )}
              {subCategoryCount > 0 && (
                <span className="mt-2 block font-medium text-red-600">
                  This category has {subCategoryCount} sub-category(ies). You must delete or
                  reassign them first.
                </span>
              )}
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(false)}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                disabled={isDeleting || subCategoryCount > 0}
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Force Delete Confirmation Modal */}
      {showForceConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-semibold text-red-600">
              ⚠️ Force Delete Category
            </h3>
            <p className="mb-6 text-sm text-gray-600">
              This category has {medicineCount} medicine(s) associated with it.
              <span className="mt-2 block font-medium text-red-600">
                Force deleting will remove the category but keep the medicines. The medicines
                will need to be reassigned to another category.
              </span>
              <span className="mt-2 block">
                Are you sure you want to proceed?
              </span>
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowForceConfirm(false)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(true)}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Force Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
