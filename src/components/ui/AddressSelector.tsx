'use client'

import React, { useState, useCallback, useRef, useEffect } from 'react'
import { addresses } from '../../config/addresses'
import { isAddress } from 'viem'
import { saveRecentAddress, getRecentAddresses } from '../../utils/typeUtils'
import { matchesSearchTerm, getSearchScore, searchWithHighlights, type AddressItem } from '../../utils/addressSearch'
import { useKeyboardNavigation } from '../../hooks/useKeyboardNavigation'
import HighlightedText from './HighlightedText'
import SearchPreview from './SearchPreview'

interface AddressSelectorProps {
  value: string
  onChange: (address: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  defaultValue?: string
}

// Get recent addresses using the utility function
const getRecentAddressesList = (): string[] => {
  return getRecentAddresses(isAddress)
}

export default function AddressSelector({
  value,
  onChange,
  placeholder = "Select address...",
  className = "",
  disabled = false,
  defaultValue
}: AddressSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Set default value on mount if provided and no current value
  useEffect(() => {
    if (defaultValue && !value && isAddress(defaultValue)) {
      onChange(defaultValue)
    }
  }, [defaultValue, value, onChange])

  // Get all addresses from config and localStorage
  const allConfigAddresses = new Set<string>()
  const addressCategories = Object.entries(addresses).map(([category, categoryData]) => {
    const addresses: AddressItem[] = []

    if (typeof categoryData === 'object' && categoryData !== null) {
      Object.entries(categoryData).forEach(([key, value]) => {
        if (typeof value === 'string') {
          addresses.push({
            path: `${category}.${key}`,
            label: key,
            address: value,
            category: category
          })
          allConfigAddresses.add(value.toLowerCase())
        } else if (typeof value === 'object' && value !== null) {
          // Handle nested objects like contracts.sepolia
          Object.entries(value).forEach(([subKey, subValue]) => {
            if (typeof subValue === 'string') {
              addresses.push({
                path: `${category}.${key}.${subKey}`,
                label: `${key}.${subKey}`,
                address: subValue,
                category: category
              })
              allConfigAddresses.add(subValue.toLowerCase())
            }
          })
        }
      })
    }

    return {
      category,
      addresses,
      count: addresses.length
    }
  }).filter(cat => cat.count > 0)

  // Get recent addresses that aren't in config
  const recentAddresses = getRecentAddressesList().filter(addr =>
    !allConfigAddresses.has(addr.toLowerCase())
  )

  // Add recent addresses category if there are any
  if (recentAddresses.length > 0) {
    addressCategories.unshift({
      category: 'recent',
      addresses: recentAddresses.map(addr => ({
        path: `recent.${addr}`,
        label: addr,
        address: addr,
        category: 'recent'
      })),
      count: recentAddresses.length
    })
  }


  // Get all addresses for highlighting
  const allAddresses = addressCategories.flatMap(category =>
    category.addresses.map(addr => ({ ...addr, category: category.category }))
  )

  // Apply search with highlights
  const highlightedResults = searchWithHighlights(allAddresses, searchTerm)

  // Filter to only show matching results and sort by score
  const filteredResults = highlightedResults
    .filter(item => matchesSearchTerm(item, searchTerm))
    .map(item => ({ ...item, score: getSearchScore(item, searchTerm) }))
    .sort((a, b) => b.score - a.score) // Sort by relevance score

  // Group back into categories for display
  const filteredCategories = addressCategories.map(category => ({
    ...category,
    addresses: filteredResults.filter(item => item.category === category.category)
  })).filter(category => category.addresses.length > 0)

  // Flatten all filtered addresses for keyboard navigation
  const allFilteredAddresses = filteredResults

  const handleSelect = useCallback((address: string) => {
    onChange(address)
    saveRecentAddress(address, isAddress)
    setIsOpen(false)
    setSearchTerm('')
    setSelectedIndex(-1)
  }, [onChange])

  // Use shared keyboard navigation hook
  const { handleSearchKeyDown } = useKeyboardNavigation({
    searchTerm,
    selectedIndex,
    allFilteredAddresses,
    onSelect: (address) => handleSelect(address),
    onClear: () => {
      setSearchTerm('')
      setSelectedIndex(-1)
    },
    onIndexChange: setSelectedIndex,
    onClose: () => setIsOpen(false)
  })

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    let newValue = e.target.value

    // Auto-add "0x" prefix for address input
    if (newValue.length > 0 && !newValue.startsWith('0x')) {
      // Check if it looks like a hex address (40 characters of hex)
      const hexPattern = /^[0-9a-fA-F]{40}$/
      if (hexPattern.test(newValue)) {
        newValue = '0x' + newValue
      }
    }

    setSearchTerm(newValue)
  }, [])

  const handleToggle = useCallback(() => {
    if (!disabled) {
      setIsOpen(prev => !prev)
      if (!isOpen) {
        setSearchTerm('')
        setExpandedCategories(new Set())
        setSelectedIndex(-1)
      }
    }
  }, [disabled, isOpen])

  const toggleCategory = useCallback((category: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev)
      if (newSet.has(category)) {
        newSet.delete(category)
      } else {
        newSet.add(category)
      }
      return newSet
    })
  }, [])

  // Set selected index to first result when search term changes
  useEffect(() => {
    setSelectedIndex(allFilteredAddresses.length > 0 ? 0 : -1)
  }, [searchTerm, allFilteredAddresses.length])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSearchTerm('')
        setExpandedCategories(new Set())
        setSelectedIndex(-1)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Find the display value and key for the current value
  const getDisplayInfo = () => {
    if (!value) return { displayValue: '', key: null }

    // Check if it's a config address (from addresses.ts)
    for (const category of addressCategories) {
      // Skip the 'recent' category as it contains custom addresses
      if (category.category === 'recent') continue

      const found = category.addresses.find(addr => addr.address === value)
      if (found) {
        return {
          displayValue: value,
          key: found.path
        }
      }
    }

    // If not found in config, it's a custom address - show only the address
    return { displayValue: value, key: null }
  }

  const { displayValue, key } = getDisplayInfo()

  const isSearchTermValidAddress = searchTerm.trim() && isAddress(searchTerm.trim())

  // Get the selected address for preview
  const selectedAddress = selectedIndex >= 0 && selectedIndex < allFilteredAddresses.length
    ? allFilteredAddresses[selectedIndex].address
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
              <div className="flex items-center space-x-2">
                <span className="truncate text-gray-900 font-mono">
                  {displayValue}
                </span>
                {key && (
                  <span className="text-gray-500 text-sm flex-shrink-0">
                    {key}
                  </span>
                )}
              </div>
            ) : (
              <span className="text-gray-500">{placeholder}</span>
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
              placeholder="Search addresses or type a new address..."
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              autoFocus
            />
            {/* Preview overlay */}
            <SearchPreview
              searchTerm={searchTerm}
              selectedValue={selectedAddress}
            />
            {isSearchTermValidAddress && filteredCategories.length === 0 && (
              <p className="mt-1 text-xs text-blue-600">
                Press Enter to add this address
              </p>
            )}
            {searchTerm && filteredCategories.length === 0 && !isSearchTermValidAddress && (
              <p className="mt-1 text-xs text-gray-500">
                No matches found. Try different search terms or check spelling.
              </p>
            )}
          </div>

          {/* Address Categories */}
          <div className="max-h-48 overflow-y-auto">
            {filteredCategories.length > 0 ? (
              <div className="p-2 space-y-1">
                {filteredCategories.map(({ category, addresses, count }) => {
                  const isExpanded = expandedCategories.has(category) || searchTerm.length > 0
                  return (
                    <div key={category} className="border border-gray-200 rounded-lg overflow-hidden">
                      {/* Category Header */}
                      <button
                        type="button"
                        onClick={() => toggleCategory(category)}
                        className="w-full px-3 py-2 bg-gray-50 hover:bg-gray-100 flex items-center justify-between text-left transition-colors"
                      >
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-gray-900 capitalize">
                            {category === 'recent' ? 'Recently Used' : category}
                          </span>
                          <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded-full">
                            {count}
                          </span>
                        </div>
                        {searchTerm.length === 0 && (
                          <svg
                            className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        )}
                      </button>

                      {/* Category Addresses */}
                      {isExpanded && (
                        <div className="bg-white">
                          {addresses.map((item, index) => {
                            const { path, label, address } = item
                            const globalIndex = allFilteredAddresses.findIndex(addr => addr.path === path)
                            const isSelected = globalIndex === selectedIndex
                            return (
                              <button
                                key={path}
                                type="button"
                                onClick={() => handleSelect(address)}
                                className={`w-full px-3 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none border-t border-gray-100 ${
                                  value === address ? 'bg-blue-50 text-blue-900' : 'text-gray-900'
                                } ${isSelected ? 'bg-blue-100 border-blue-300' : ''}`}
                              >
                                <div className="text-sm font-medium truncate">
                                  <HighlightedText
                                    text={label}
                                    highlights={(item.highlights as any)?.label || []}
                                  />
                                </div>
                                <div className="text-xs text-gray-500 font-mono truncate">
                                  <HighlightedText
                                    text={address}
                                    highlights={(item.highlights as any)?.address || []}
                                    highlightClassName="bg-yellow-200 font-medium"
                                  />
                                </div>
                              </button>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="px-3 py-2 text-sm text-gray-500 text-center">
                {isSearchTermValidAddress ? 'Press Enter to add this address' : 'No addresses found'}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
