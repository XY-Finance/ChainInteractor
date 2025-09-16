// Enhanced search utilities for address components using Fuse.js
//
// Features:
// - Sophisticated fuzzy matching with typo tolerance
// - Path-based search (eoa.user0, group1.set2)
// - Space-separated partial matching (eoa user1)
// - Abbreviation matching (eu for eoa.user0)
// - Advanced search operators (!, ^, $, =, etc.)
// - Configurable search presets (strict, normal, loose, typoTolerant)
// - Search result highlighting
// - Weighted field scoring
//
import Fuse from 'fuse.js'

export interface AddressItem {
  path: string
  label: string
  address: string
  category: string
  highlights?: {
    path?: number[][]
    label?: number[][]
    address?: number[][]
  }
  score?: number
}

// Fuse.js configuration for sophisticated fuzzy search (path and label only)
const fuseOptions = {
  keys: [
    { name: 'path', weight: 0.6 },
    { name: 'label', weight: 0.4 }
    // Note: address is excluded from fuzzy search - handled separately with substring matching
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

// Enhanced search function - fuzzy search for path/label, substring for address
export const matchesSearchTerm = (item: AddressItem, searchTerm: string): boolean => {
  if (!searchTerm.trim()) return true

  const searchLower = searchTerm.toLowerCase().trim()

  // Simple substring matching for address (no fuzzy needed)
  if (item.address.toLowerCase().includes(searchLower)) {
    return true
  }

  // Fuse.js fuzzy matching for path and label only
  const fuse = new Fuse([item], fuseOptions)
  const results = fuse.search(searchTerm)
  return results.length > 0
}


// Enhanced scoring - fuzzy scoring for path/label, simple scoring for address
export const getSearchScore = (item: AddressItem, searchTerm: string): number => {
  if (!searchTerm.trim()) return 0

  const searchLower = searchTerm.toLowerCase().trim()

  // Simple scoring for address matches
  if (item.address.toLowerCase().includes(searchLower)) {
    // Address matches get medium priority (since they're less meaningful)
    return 30
  }

  // Fuse.js sophisticated scoring for path and label
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

// Advanced search with Fuse.js extended syntax support
export const advancedSearch = (items: AddressItem[], searchTerm: string): AddressItem[] => {
  if (!searchTerm.trim()) return items

  const fuse = new Fuse(items, {
    ...fuseOptions,
    // Enable advanced search operators
    useExtendedSearch: true,
  })

  const results = fuse.search(searchTerm)
  return results.map(result => result.item)
}

// Search with highlighting support - fuzzy for path/label, simple for address
export const searchWithHighlights = (items: AddressItem[], searchTerm: string) => {
  if (!searchTerm.trim()) return items.map(item => ({ ...item, highlights: {} }))

  const searchLower = searchTerm.toLowerCase().trim()

  return items.map(item => {
    const highlights: { path?: number[][], label?: number[][], address?: number[][] } = {}

    // Simple highlighting for address (substring matching) - always check
    const addressLower = item.address.toLowerCase()
    const addressIndex = addressLower.indexOf(searchLower)
    if (addressIndex !== -1) {
      highlights.address = [[addressIndex, addressIndex + searchLower.length - 1]]
    }

    // Fuzzy highlighting for path and label using Fuse.js
    const fuse = new Fuse([item], {
      ...fuseOptions,
      includeMatches: true,
    })

    const results = fuse.search(searchTerm)
    if (results.length > 0) {
      const result = results[0]
      result.matches?.forEach(match => {
        if (match.key && (match.key === 'path' || match.key === 'label')) {
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

// Test function to verify address highlighting works
export const testAddressHighlighting = (items: AddressItem[], searchTerm: string) => {
  const results = searchWithHighlights(items, searchTerm)
  return results.map(item => ({
    path: item.path,
    label: item.label,
    address: item.address,
    hasAddressHighlight: !!((item.highlights as any)?.address && (item.highlights as any).address.length > 0),
    addressHighlight: (item.highlights as any)?.address
  }))
}

// Configuration presets for different search modes
export const searchPresets = {
  strict: {
    ...fuseOptions,
    threshold: 0.2, // Very strict matching
  },
  normal: {
    ...fuseOptions,
    threshold: 0.4, // Balanced matching
  },
  loose: {
    ...fuseOptions,
    threshold: 0.6, // Loose matching for typos
  },
  typoTolerant: {
    ...fuseOptions,
    threshold: 0.8, // Very tolerant of typos
    distance: 200,
  }
}
