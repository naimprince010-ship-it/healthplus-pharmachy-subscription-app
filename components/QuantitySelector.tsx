'use client'

import { useState } from 'react'
import { Minus, Plus } from 'lucide-react'

interface QuantitySelectorProps {
  initialQuantity?: number
  min?: number
  max?: number
  onChange: (quantity: number) => void
  className?: string
}

export function QuantitySelector({
  initialQuantity = 1,
  min = 1,
  max = 99,
  onChange,
  className = '',
}: QuantitySelectorProps) {
  const [quantity, setQuantity] = useState(initialQuantity)

  const handleDecrease = () => {
    if (quantity > min) {
      const newQuantity = quantity - 1
      setQuantity(newQuantity)
      onChange(newQuantity)
    }
  }

  const handleIncrease = () => {
    if (quantity < max) {
      const newQuantity = quantity + 1
      setQuantity(newQuantity)
      onChange(newQuantity)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10)
    if (!isNaN(value) && value >= min && value <= max) {
      setQuantity(value)
      onChange(value)
    }
  }

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <button
        type="button"
        onClick={handleDecrease}
        disabled={quantity <= min}
        className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        aria-label="Decrease quantity"
      >
        <Minus className="h-4 w-4" />
      </button>
      <input
        type="number"
        value={quantity}
        onChange={handleInputChange}
        min={min}
        max={max}
        className="h-10 w-14 rounded-lg border border-gray-300 text-center text-lg font-medium text-gray-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
      />
      <button
        type="button"
        onClick={handleIncrease}
        disabled={quantity >= max}
        className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        aria-label="Increase quantity"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  )
}
