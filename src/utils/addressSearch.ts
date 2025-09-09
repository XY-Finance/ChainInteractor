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
}

// Fuse.js configuration for sophisticated fuzzy search
const fuseOptions = {
  keys: [
    { name: 'path', weight: 0.4 },
    { name: 'label', weight: 0.3 },
    { name: 'address', weight: 0.3 }
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

// Ultra-simple search function - let Fuse.js handle everything
export const matchesSearchTerm = (item: AddressItem, searchTerm: string): boolean => {
  if (!searchTerm.trim()) return true

  // Fuse.js handles all matching: direct matches, fuzzy matching, path matching, etc.
  const fuse = new Fuse([item], fuseOptions)
  const results = fuse.search(searchTerm)
  return results.length > 0
}

// Advanced fuzzy search with scoring and ranking
export const fuzzySearchAddresses = (items: AddressItem[], searchTerm: string): AddressItem[] => {
  if (!searchTerm.trim()) return items

  const fuse = new Fuse(items, fuseOptions)
  const results = fuse.search(searchTerm)

  return results.map(result => ({
    ...result.item,
    score: result.score || 0,
    matches: result.matches || []
  }))
}

// Ultra-simple scoring - let Fuse.js handle everything
export const getSearchScore = (item: AddressItem, searchTerm: string): number => {
  if (!searchTerm.trim()) return 0

  // Fuse.js handles all sophisticated scoring
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

// Search with highlighting support
export const searchWithHighlights = (items: AddressItem[], searchTerm: string) => {
  if (!searchTerm.trim()) return items.map(item => ({ ...item, highlights: {} }))

  const fuse = new Fuse(items, {
    ...fuseOptions,
    includeMatches: true,
  })

  const results = fuse.search(searchTerm)
  return results.map(result => ({
    ...result.item,
    highlights: result.matches?.reduce((acc, match) => {
      if (match.key) {
        acc[match.key] = match.indices.map(range => [range[0], range[1]])
      }
      return acc
    }, {} as Record<string, number[][]>) || {}
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
