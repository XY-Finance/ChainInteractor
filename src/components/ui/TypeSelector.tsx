'use client'

import React, { useState, useCallback, useRef, useEffect } from 'react'
import { useKeyboardNavigation } from '../../hooks/useKeyboardNavigation'
import HighlightedText from './HighlightedText'
import Fuse from 'fuse.js'

interface TypeItem {
  type: string
  category: string
  highlights?: {
    type?: number[][]
    category?: number[][]
  }
  score?: number
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

// Fuse.js configuration for fuzzy search
const fuseOptions = {
  keys: [
    { name: 'type', weight: 0.8 },
    { name: 'category', weight: 0.2 }
  ],
  threshold: 0.4, // Lower = more strict matching (0.0 = exact, 1.0 = match anything)
  distance: 100, // Maximum distance for a match
  includeScore: true,
  includeMatches: true,
  minMatchCharLength: 1,
  shouldSort: true,
  findAllMatches: true,
  ignoreLocation: true, // Don't consider location of match in string
  useExtendedSearch: true, // Enable advanced search syntax
}

// Fuzzy search for types using Fuse.js
const matchesSearchTerm = (item: TypeItem, searchTerm: string): boolean => {
  if (!searchTerm.trim()) return true

  const fuse = new Fuse([item], fuseOptions)
  const results = fuse.search(searchTerm)
  return results.length > 0
}

// Fuzzy scoring for types using Fuse.js
const getSearchScore = (item: TypeItem, searchTerm: string): number => {
  if (!searchTerm.trim()) return 0

  const fuse = new Fuse([item], fuseOptions)
  const results = fuse.search(searchTerm)

  if (results.length > 0) {
    // Fuse.js returns scores where 0 = perfect match, 1 = no match
    // Convert to our scoring system where higher = better
    const fuseScore = results[0].score || 1
    return Math.round((1 - fuseScore) * 100)
  }

  return 0
}

// Search with highlighting support using Fuse.js
const searchWithHighlights = (items: TypeItem[], searchTerm: string) => {
  if (!searchTerm.trim()) return items.map(item => ({ ...item, highlights: {} }))

  const fuse = new Fuse(items, {
    ...fuseOptions,
    includeMatches: true,
  })

  const results = fuse.search(searchTerm)
  const resultMap = new Map(results.map(result => [result.item.type, result]))

  return items.map(item => {
    const result = resultMap.get(item.type)
    const highlights: { type?: number[][], category?: number[][] } = {}

    if (result) {
      result.matches?.forEach(match => {
        if (match.key && (match.key === 'type' || match.key === 'category')) {
          highlights[match.key] = match.indices.map(range => [range[0], range[1]])
        }
      })
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

  // Filter to only show matching results and sort by score
  const filteredTypes = highlightedResults
    .filter(item => matchesSearchTerm(item, searchTerm))
    .map(item => ({ ...item, score: getSearchScore(item, searchTerm) }))
    .sort((a, b) => b.score - a.score)

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

  // Reset selected index when search term changes
  useEffect(() => {
    setSelectedIndex(-1)
  }, [searchTerm])

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
          <div className="p-2 border-b border-gray-200">
            <input
              type="text"
              value={searchTerm}
              onChange={handleSearchChange}
              onKeyDown={handleSearchKeyDown}
              placeholder="Search types (e.g., uint, address, bytes)..."
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              autoFocus
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
