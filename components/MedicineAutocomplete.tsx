'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, X } from 'lucide-react'

interface Medicine {
  id: string
  name: string
  genericName: string | null
  strength: string | null
  sellingPrice: number
}

interface MedicineAutocompleteProps {
  value: string
  onChange: (value: string) => void
  onSelect: (medicine: Medicine | null, snapshot: string | null) => void
  placeholder?: string
  className?: string
}

export function MedicineAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = 'Search medicines...',
  className = '',
}: MedicineAutocompleteProps) {
  const [query, setQuery] = useState(value)
  const [suggestions, setSuggestions] = useState<Medicine[]>([])
  const [loading, setLoading] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [abortController, setAbortController] = useState<AbortController | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    setQuery(value)
  }, [value])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    if (query.length < 2) {
      setSuggestions([])
      setShowDropdown(false)
      return
    }

    debounceTimerRef.current = setTimeout(() => {
      searchMedicines(query)
    }, 300)

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query])

  async function searchMedicines(searchQuery: string) {
    if (abortController) {
      abortController.abort()
    }

    const controller = new AbortController()
    setAbortController(controller)
    setLoading(true)

    try {
      const response = await fetch(
        `/api/admin/medicines?search=${encodeURIComponent(searchQuery)}&limit=10&isActive=true`,
        { signal: controller.signal }
      )

      if (!response.ok) {
        throw new Error('Failed to search medicines')
      }

      const data = await response.json()
      setSuggestions(data.medicines || [])
      setShowDropdown(true)
      setSelectedIndex(-1)
    } catch (error: unknown) {
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error('Search error:', error)
      }
    } finally {
      setLoading(false)
      setAbortController(null)
    }
  }

  function buildMedicineLabel(medicine: Medicine): string {
    const parts = [medicine.name]
    if (medicine.strength) {
      parts.push(medicine.strength)
    }
    const label = parts.join(' ')
    if (medicine.genericName) {
      return `${label} – ${medicine.genericName}`
    }
    return label
  }

  function handleSelectMedicine(medicine: Medicine) {
    const snapshot = buildMedicineLabel(medicine)
    setQuery(snapshot)
    onChange(snapshot)
    onSelect(medicine, snapshot)
    setShowDropdown(false)
    setSuggestions([])
  }

  function handleSelectCustom() {
    setQuery(query)
    onChange(query)
    onSelect(null, null)
    setShowDropdown(false)
    setSuggestions([])
  }

  function handleInputChange(newValue: string) {
    setQuery(newValue)
    onChange(newValue)
  }

  function handleClear() {
    setQuery('')
    onChange('')
    onSelect(null, null)
    setSuggestions([])
    setShowDropdown(false)
    inputRef.current?.focus()
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!showDropdown) return

    const totalOptions = suggestions.length + 1

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex((prev) => (prev + 1) % totalOptions)
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex((prev) => (prev - 1 + totalOptions) % totalOptions)
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex === -1) {
          return
        }
        if (selectedIndex === suggestions.length) {
          handleSelectCustom()
        } else if (suggestions[selectedIndex]) {
          handleSelectMedicine(suggestions[selectedIndex])
        }
        break
      case 'Escape':
        e.preventDefault()
        setShowDropdown(false)
        break
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (query.length >= 2 && suggestions.length > 0) {
              setShowDropdown(true)
            }
          }}
          placeholder={placeholder}
          className={`w-full rounded border px-3 py-2 pr-20 ${className}`}
          autoComplete="off"
        />
        <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center space-x-1">
          {loading && (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
          )}
          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <Search className="h-4 w-4 text-gray-400" />
        </div>
      </div>

      {showDropdown && (suggestions.length > 0 || query.length >= 2) && (
        <div className="absolute z-50 mt-1 max-h-64 w-full overflow-y-auto rounded-lg border border-gray-300 bg-white shadow-lg">
          {suggestions.length > 0 ? (
            <>
              {suggestions.map((medicine, index) => (
                <button
                  key={medicine.id}
                  type="button"
                  onClick={() => handleSelectMedicine(medicine)}
                  className={`w-full px-4 py-3 text-left hover:bg-blue-50 ${
                    selectedIndex === index ? 'bg-blue-100' : ''
                  }`}
                >
                  <div className="font-medium text-gray-900">{buildMedicineLabel(medicine)}</div>
                  <div className="text-sm text-gray-600">৳{medicine.sellingPrice.toFixed(2)}</div>
                </button>
              ))}
              <button
                type="button"
                onClick={handleSelectCustom}
                className={`w-full border-t border-gray-200 px-4 py-3 text-left hover:bg-gray-50 ${
                  selectedIndex === suggestions.length ? 'bg-gray-100' : ''
                }`}
              >
                <div className="text-sm text-gray-700">
                  Use <span className="font-medium">&quot;{query}&quot;</span> as custom item
                </div>
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={handleSelectCustom}
              className="w-full px-4 py-3 text-left hover:bg-gray-50"
            >
              <div className="text-sm text-gray-700">
                Use <span className="font-medium">&quot;{query}&quot;</span> as custom item
              </div>
            </button>
          )}
        </div>
      )}
    </div>
  )
}
