'use client'

import React, { useState, useCallback, useRef, useEffect } from 'react'
import { addresses } from '../../config/addresses'
import { isAddress } from 'viem'

interface AddressSelectorProps {
  value: string
  onChange: (address: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

// localStorage utilities for recent addresses
const saveRecentAddress = (address: string) => {
  // Only save valid Ethereum addresses to localStorage
  if (!isAddress(address)) {
    console.warn('Attempted to save invalid address to localStorage:', address)
    return
  }

  const key = 'recent_addresses'
  const recent = JSON.parse(localStorage.getItem(key) || '[]')
  const updated = [address, ...recent.filter((v: string) => v !== address)].slice(0, 5)
  localStorage.setItem(key, JSON.stringify(updated))
}

const getRecentAddresses = (): string[] => {
  const key = 'recent_addresses'
  const addresses = JSON.parse(localStorage.getItem(key) || '[]')
  // Filter out any invalid addresses that might exist in localStorage
  const validAddresses = addresses.filter((addr: string) => isAddress(addr))

  // If we filtered out invalid addresses, update localStorage
  if (validAddresses.length !== addresses.length) {
    localStorage.setItem(key, JSON.stringify(validAddresses))
  }

  return validAddresses
}

export default function AddressSelector({
  value,
  onChange,
  placeholder = "Select address...",
  className = "",
  disabled = false
}: AddressSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Get all addresses from config and localStorage
  const allConfigAddresses = new Set<string>()
  const addressCategories = Object.entries(addresses).map(([category, categoryData]) => {
    const addresses: Array<{ path: string; label: string; address: string }> = []

    if (typeof categoryData === 'object' && categoryData !== null) {
      Object.entries(categoryData).forEach(([key, value]) => {
        if (typeof value === 'string') {
          addresses.push({
            path: `${category}.${key}`,
            label: key,
            address: value
          })
          allConfigAddresses.add(value.toLowerCase())
        } else if (typeof value === 'object' && value !== null) {
          // Handle nested objects like contracts.sepolia
          Object.entries(value).forEach(([subKey, subValue]) => {
            if (typeof subValue === 'string') {
              addresses.push({
                path: `${category}.${key}.${subKey}`,
                label: `${key}.${subKey}`,
                address: subValue
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
        address: addr
      })),
      count: recentAddresses.length
    })
  }

  // Filter addresses based on search term
  const filteredCategories = addressCategories.map(category => ({
    ...category,
    addresses: category.addresses.filter(item =>
      item.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.address.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(category => category.addresses.length > 0)

  // Flatten all filtered addresses for keyboard navigation
  const allFilteredAddresses = filteredCategories.flatMap(category =>
    category.addresses.map(addr => ({ ...addr, category: category.category }))
  )

  const handleSelect = useCallback((address: string) => {
    onChange(address)
    saveRecentAddress(address)
    setIsOpen(false)
    setSearchTerm('')
    setSelectedIndex(-1)
  }, [onChange])

  const handleSearchKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      const trimmedSearch = searchTerm.trim()

      // If there's a selected item, accept it
      if (selectedIndex >= 0 && selectedIndex < allFilteredAddresses.length) {
        handleSelect(allFilteredAddresses[selectedIndex].address)
        return
      }

      // If search term is a valid address and no matches found, add it to localStorage
      if (trimmedSearch && isAddress(trimmedSearch) && filteredCategories.length === 0) {
        handleSelect(trimmedSearch)
      }
    } else if (e.key === 'Tab') {
      e.preventDefault()
      if (allFilteredAddresses.length > 0) {
        const nextIndex = selectedIndex < allFilteredAddresses.length - 1 ? selectedIndex + 1 : 0
        setSelectedIndex(nextIndex)
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (allFilteredAddresses.length > 0) {
        const nextIndex = selectedIndex < allFilteredAddresses.length - 1 ? selectedIndex + 1 : 0
        setSelectedIndex(nextIndex)
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (allFilteredAddresses.length > 0) {
        const prevIndex = selectedIndex > 0 ? selectedIndex - 1 : allFilteredAddresses.length - 1
        setSelectedIndex(prevIndex)
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false)
      setSearchTerm('')
      setSelectedIndex(-1)
    }
  }, [searchTerm, filteredCategories.length, selectedIndex, allFilteredAddresses, handleSelect])

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

  // Create preview text with greyed out parts
  const getPreviewText = () => {
    if (!selectedAddress || !searchTerm.trim()) {
      return searchTerm
    }

    const searchLower = searchTerm.toLowerCase()
    const addressLower = selectedAddress.toLowerCase()

    // Find where the search term matches in the address
    const matchIndex = addressLower.indexOf(searchLower)

    if (matchIndex === -1) {
      return searchTerm
    }

    // Split the address into parts: before match, match, after match
    const beforeMatch = selectedAddress.substring(0, matchIndex)
    const match = selectedAddress.substring(matchIndex, matchIndex + searchTerm.length)
    const afterMatch = selectedAddress.substring(matchIndex + searchTerm.length)

    return (
      <>
        <span className="text-gray-400">{beforeMatch}</span>
        <span className="text-gray-900">{match}</span>
        <span className="text-gray-400">{afterMatch}</span>
      </>
    )
  }

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
          <div className="p-2 border-b border-gray-200">
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={handleSearchChange}
                onKeyDown={handleSearchKeyDown}
                placeholder="Search addresses or type a new address..."
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-transparent relative z-10"
                autoFocus
              />
              {/* Preview overlay */}
              {selectedAddress && searchTerm.trim() && (
                <div className="absolute inset-0 px-2 py-1 text-sm pointer-events-none">
                  <div className="font-mono">
                    {getPreviewText()}
                  </div>
                </div>
              )}
            </div>
            {isSearchTermValidAddress && filteredCategories.length === 0 && (
              <p className="mt-1 text-xs text-blue-600">
                Press Enter to add this address
              </p>
            )}
            {allFilteredAddresses.length > 0 && (
              <p className="mt-1 text-xs text-gray-500">
                Use Tab/Arrow keys to navigate, Enter to select
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
                          {addresses.map(({ path, label, address }, index) => {
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
                                <div className="text-sm font-medium truncate">{label}</div>
                                <div className="text-xs text-gray-500 font-mono truncate">{address}</div>
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
