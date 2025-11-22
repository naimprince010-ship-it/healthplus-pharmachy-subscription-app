import { Search } from 'lucide-react'

export default function MedicinesPage() {
  return (
    <div className="bg-white py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Browse Medicines</h1>
          <div className="relative">
            <input
              type="text"
              placeholder="Search medicines..."
              className="w-64 rounded-lg border border-gray-300 py-2 pl-10 pr-4 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          </div>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-3 lg:grid-cols-4">
          <div className="rounded-lg border border-gray-200 p-4 shadow-sm">
            <div className="mb-4 h-48 rounded-lg bg-gray-100"></div>
            <h3 className="font-semibold text-gray-900">Medicine Name</h3>
            <p className="mt-1 text-sm text-gray-600">Generic Name</p>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-xl font-bold text-gray-900">৳100</span>
              <button className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-teal-700">
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
