'use client'

import React, { useState, useCallback, useRef, useEffect } from 'react'
import { addresses } from '../../config/addresses'
import { isAddress } from 'viem'
import { matchesSearchTerm, searchWithHighlights, type AddressItem } from '../../utils/addressSearch'
import { useKeyboardNavigation } from '../../hooks/useKeyboardNavigation'
import HighlightedText from './HighlightedText'
import AddressSelector from './AddressSelector'

interface AddressBookProps {
  className?: string
}

// localStorage utilities for recent addresses
const getRecentAddresses = (): string[] => {
  const key = 'recent_addresses'
  return JSON.parse(localStorage.getItem(key) || '[]')
}

export default function AddressBook({ className = '' }: AddressBookProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const panelRef = useRef<HTMLDivElement>(null)

  const handleCopy = useCallback(async (address: string, label: string) => {
    try {
      await navigator.clipboard.writeText(address)
      setCopiedAddress(label)
      setTimeout(() => setCopiedAddress(null), 2000)
    } catch (error) {
      console.error('Failed to copy address:', error)
    }
  }, [])

  const toggleExpanded = useCallback(() => {
    setIsExpanded(prev => {
      const newExpanded = !prev
      if (!newExpanded) {
        // Reset search state when closing
        setSearchTerm('')
        setSelectedIndex(-1)
        setExpandedCategories(new Set())
      }
      return newExpanded
    })
  }, [])

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

  // Handle address selection from AddressSelector
  const handleAddressSelect = useCallback((address: string) => {
    handleCopy(address, address)
  }, [handleCopy])

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
  const recentAddresses = getRecentAddresses().filter(addr =>
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

  // Filter to only show matching results
  const filteredResults = highlightedResults.filter(item => matchesSearchTerm(item, searchTerm))

  // Group back into categories for display
  const filteredCategories = addressCategories.map(category => ({
    ...category,
    addresses: filteredResults.filter(item => item.category === category.category)
  })).filter(category => category.addresses.length > 0)

  // Flatten all filtered addresses for keyboard navigation
  const allFilteredAddresses = filteredResults

  // Use shared keyboard navigation hook
  const { handleSearchKeyDown } = useKeyboardNavigation({
    searchTerm,
    selectedIndex,
    allFilteredAddresses,
    onSelect: handleCopy,
    onClear: () => setSearchTerm(''),
    onIndexChange: setSelectedIndex
  })

  // Reset selected index when search term changes
  useEffect(() => {
    setSelectedIndex(-1)
  }, [searchTerm])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setIsExpanded(false)
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

  return (
    <div className={`fixed bottom-4 right-4 z-50 ${className}`}>
      {/* Address Book Button */}
      <button
        onClick={toggleExpanded}
        className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-3 shadow-lg transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        title="Address Book"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>

      {/* Address Book Panel */}
      {isExpanded && (
        <div className="absolute bottom-full right-0 mb-2 w-96 max-h-96 bg-white border border-gray-300 rounded-lg shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-blue-600 text-white px-4 py-3 flex justify-between items-center">
            <h3 className="font-semibold text-lg">Address Book</h3>
            <button
              onClick={toggleExpanded}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Search Input */}
          <div className="p-2 border-b border-gray-200">
            <input
              type="text"
              value={searchTerm}
              onChange={handleSearchChange}
              onKeyDown={handleSearchKeyDown}
                     placeholder="Search addresses... (try: eoa user0, group1.set2, fuzzy matching)"
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              autoFocus
            />
            {allFilteredAddresses.length > 0 && (
              <p className="mt-1 text-xs text-gray-500">
                Use Tab/Arrow keys to navigate, Enter to copy
              </p>
            )}
          </div>

          {/* Address Categories */}
          <div className="max-h-80 overflow-y-auto">
            {(searchTerm ? filteredCategories : addressCategories).length > 0 ? (
              <div className="p-2 space-y-1">
                {(searchTerm ? filteredCategories : addressCategories).map(({ category, addresses, count }) => {
                  const isExpanded = expandedCategories.has(category) || searchTerm.length > 0
                  return (
                    <div key={category} className="border border-gray-200 rounded-lg overflow-hidden">
                      {/* Category Header */}
                      <button
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
                        <svg
                          className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>

                      {/* Category Addresses */}
                      {isExpanded && (
                        <div className="bg-white">
                          {addresses.map((item, index) => {
                            const { path, label, address } = item
                            const globalIndex = allFilteredAddresses.findIndex(addr => addr.path === path)
                            const isSelected = globalIndex === selectedIndex
                            return (
                              <div
                                key={path}
                                className={`group flex items-center justify-between p-3 hover:bg-gray-50 transition-colors cursor-pointer border-t border-gray-100 ${
                                  isSelected ? 'bg-blue-100 border-blue-300' : ''
                                }`}
                                onClick={() => handleCopy(address, `${category}.${label}`)}
                              >
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-gray-900 truncate">
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
                              </div>
                              <div className="ml-3 flex items-center">
                                {copiedAddress === `${category}.${label}` ? (
                                  <span className="text-green-600 text-sm font-medium">Copied!</span>
                                ) : (
                                  <svg className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                  </svg>
                                )}
                              </div>
                            </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="p-4 text-center text-gray-500">
                {searchTerm ? 'No addresses found matching your search' : 'No addresses found'}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-4 py-2 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              Click any address to copy to clipboard
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
