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
  const key = 'recent_addresses'
  const recent = JSON.parse(localStorage.getItem(key) || '[]')
  const updated = [address, ...recent.filter((v: string) => v !== address)].slice(0, 5)
  localStorage.setItem(key, JSON.stringify(updated))
}

const getRecentAddresses = (): string[] => {
  const key = 'recent_addresses'
  return JSON.parse(localStorage.getItem(key) || '[]')
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

  // Find the display value for the current value
  const currentDisplayValue = value || ''

  const isSearchTermValidAddress = searchTerm.trim() && isAddress(searchTerm.trim())

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
          <span className={`truncate ${value ? 'text-gray-900' : 'text-gray-500'}`}>
            {value ? currentDisplayValue : placeholder}
          </span>
          <svg
            className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
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
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder="Search addresses or type a new address..."
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              autoFocus
            />
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
