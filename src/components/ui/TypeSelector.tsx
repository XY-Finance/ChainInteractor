'use client'

import React, { useState, useCallback, useRef, useEffect } from 'react'
import { useKeyboardNavigation } from '../../hooks/useKeyboardNavigation'
import HighlightedText from './HighlightedText'
import SearchPreview from './SearchPreview'

interface TypeItem {
  type: string
  category: string
  highlights?: {
    type?: number[][]
    category?: number[][]
  }
}

interface TypeSelectorProps {
  value: string
  onChange: (type: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

// Solidity types organized by category
const SOLIDITY_TYPES: TypeItem[] = [
  // Address types
  { type: 'address', category: 'Address' },

  // Unsigned integers
  { type: 'uint256', category: 'Unsigned Integers' },
  { type: 'uint128', category: 'Unsigned Integers' },
  { type: 'uint64', category: 'Unsigned Integers' },
  { type: 'uint32', category: 'Unsigned Integers' },
  { type: 'uint16', category: 'Unsigned Integers' },
  { type: 'uint8', category: 'Unsigned Integers' },

  // Signed integers
  { type: 'int256', category: 'Signed Integers' },
  { type: 'int128', category: 'Signed Integers' },
  { type: 'int64', category: 'Signed Integers' },
  { type: 'int32', category: 'Signed Integers' },
  { type: 'int16', category: 'Signed Integers' },
  { type: 'int8', category: 'Signed Integers' },

  // Boolean
  { type: 'bool', category: 'Boolean' },

  // String
  { type: 'string', category: 'String' },

  // Bytes
  { type: 'bytes', category: 'Bytes' },
  { type: 'bytes32', category: 'Bytes' },
  { type: 'bytes16', category: 'Bytes' },
  { type: 'bytes8', category: 'Bytes' },
  { type: 'bytes4', category: 'Bytes' },
  { type: 'bytes2', category: 'Bytes' },
  { type: 'bytes1', category: 'Bytes' },

  // Structured types
  { type: 'tuple', category: 'Structured' },
  { type: 'array', category: 'Structured' },
]


// Exact sub-sequence matching - no tolerance for mistakes
const matchesSearchTerm = (item: TypeItem, searchTerm: string): boolean => {
  if (!searchTerm.trim()) return true

  const searchLower = searchTerm.toLowerCase().trim()
  const typeLower = item.type.toLowerCase()

  // Check if search term is a subsequence of the type
  let searchIndex = 0
  for (let i = 0; i < typeLower.length && searchIndex < searchLower.length; i++) {
    if (typeLower[i] === searchLower[searchIndex]) {
      searchIndex++
    }
  }

  return searchIndex === searchLower.length
}

// Simple highlighting for subsequence matches
const searchWithHighlights = (items: TypeItem[], searchTerm: string) => {
  if (!searchTerm.trim()) return items.map(item => ({ ...item, highlights: {} }))

  const searchLower = searchTerm.toLowerCase()

  return items.map(item => {
    const highlights: { type?: number[][], category?: number[][] } = {}
    const typeLower = item.type.toLowerCase()

    // Find subsequence matches in the type
    const typeHighlights: number[][] = []
    let searchIndex = 0
    for (let i = 0; i < typeLower.length && searchIndex < searchLower.length; i++) {
      if (typeLower[i] === searchLower[searchIndex]) {
        typeHighlights.push([i, i])
        searchIndex++
      }
    }

    if (typeHighlights.length > 0) {
      highlights.type = typeHighlights
    }

    return {
      ...item,
      highlights
    }
  })
}

export default function TypeSelector({
  value,
  onChange,
  placeholder = "Select type...",
  className = "",
  disabled = false
}: TypeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Apply fuzzy search with highlights
  const highlightedResults = searchWithHighlights(SOLIDITY_TYPES, searchTerm)

  // Filter to only show matching results
  const filteredTypes = highlightedResults
    .filter(item => matchesSearchTerm(item, searchTerm))

  // Group by category
  const categories = filteredTypes.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = []
    }
    acc[item.category].push(item)
    return acc
  }, {} as Record<string, TypeItem[]>)

  const handleSelect = useCallback((type: string) => {
    onChange(type)
    setIsOpen(false)
    setSearchTerm('')
    setSelectedIndex(-1)
  }, [onChange])

  // Use shared keyboard navigation hook
  const { handleSearchKeyDown } = useKeyboardNavigation({
    searchTerm,
    selectedIndex,
    allFilteredAddresses: filteredTypes.map(item => ({
      path: item.type,
      label: item.type,
      address: item.type,
      category: item.category
    })),
    onSelect: (type, label) => handleSelect(type),
    onClear: () => {
      setSearchTerm('')
      setSelectedIndex(-1)
    },
    onIndexChange: setSelectedIndex,
    onClose: () => setIsOpen(false)
  })

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
  }, [])

  const handleToggle = useCallback(() => {
    if (!disabled) {
      setIsOpen(prev => !prev)
      if (!isOpen) {
        setSearchTerm('')
        setSelectedIndex(-1)
      }
    }
  }, [disabled, isOpen])

  // Set selected index to first result when search term changes
  useEffect(() => {
    setSelectedIndex(filteredTypes.length > 0 ? 0 : -1)
  }, [searchTerm, filteredTypes.length])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSearchTerm('')
        setSelectedIndex(-1)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Find the current type info
  const currentType = SOLIDITY_TYPES.find(item => item.type === value)

  // Get the selected type for preview
  const selectedType = selectedIndex >= 0 && selectedIndex < filteredTypes.length
    ? filteredTypes[selectedIndex].type
    : null

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        className={`w-full px-3 py-2 text-left border rounded-md focus:outline-none focus:ring-2 focus:border-transparent transition-colors ${
          disabled
            ? 'bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-white border-gray-300 hover:border-gray-400 focus:ring-blue-500'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            {value ? (
              <span className="truncate text-gray-900 font-mono text-sm">
                {value}
              </span>
            ) : (
              <span className="text-gray-500 text-sm">{placeholder}</span>
            )}
          </div>
          <svg
            className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''} flex-shrink-0 ml-2`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-hidden">
          {/* Search Input */}
          <div className="p-2 border-b border-gray-200 relative">
            <input
              type="text"
              value={searchTerm}
              onChange={handleSearchChange}
              onKeyDown={handleSearchKeyDown}
              placeholder="Search types (e.g., uint, address, bytes)..."
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              autoFocus
            />
            {/* Preview overlay */}
            <SearchPreview
              searchTerm={searchTerm}
              selectedValue={selectedType}
            />
            {searchTerm && filteredTypes.length === 0 && (
              <p className="mt-1 text-xs text-gray-500">
                No types found. Try different search terms.
              </p>
            )}
          </div>

          {/* Type Categories */}
          <div className="max-h-48 overflow-y-auto">
            {Object.keys(categories).length > 0 ? (
              <div className="p-2 space-y-1">
                {Object.entries(categories).map(([category, types]) => (
                  <div key={category} className="border border-gray-200 rounded-lg overflow-hidden">
                    {/* Category Header */}
                    <div className="px-3 py-2 bg-gray-50 border-b border-gray-200">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-900">
                          {category}
                        </span>
                        <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded-full">
                          {types.length}
                        </span>
                      </div>
                    </div>

                    {/* Category Types */}
                    <div className="bg-white">
                      {types.map((item, index) => {
                        const globalIndex = filteredTypes.findIndex(type => type.type === item.type)
                        const isSelected = globalIndex === selectedIndex
                        return (
                          <button
                            key={item.type}
                            type="button"
                            onClick={() => handleSelect(item.type)}
                            className={`w-full px-3 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none border-t border-gray-100 ${
                              value === item.type ? 'bg-blue-50 text-blue-900' : 'text-gray-900'
                            } ${isSelected ? 'bg-blue-100 border-blue-300' : ''}`}
                          >
                            <div className="text-sm font-medium font-mono">
                              <HighlightedText
                                text={item.type}
                                highlights={item.highlights?.type || []}
                              />
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-3 py-2 text-sm text-gray-500 text-center">
                No types found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
