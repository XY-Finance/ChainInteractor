'use client'

import React from 'react'

interface SearchPreviewProps {
  searchTerm: string
  selectedValue: string | null
  className?: string
}

export default function SearchPreview({ searchTerm, selectedValue, className = "" }: SearchPreviewProps) {
  // Create preview text with greyed out parts
  const getPreviewText = () => {
    if (!selectedValue || !searchTerm.trim()) {
      return searchTerm
    }

    const searchLower = searchTerm.toLowerCase()
    const valueLower = selectedValue.toLowerCase()

    // First try exact substring match
    const matchIndex = valueLower.indexOf(searchLower)
    if (matchIndex !== -1) {
      // Split the value into parts: before match, match, after match
      const beforeMatch = selectedValue.substring(0, matchIndex)
      const match = selectedValue.substring(matchIndex, matchIndex + searchTerm.length)
      const afterMatch = selectedValue.substring(matchIndex + searchTerm.length)

      return (
        <>
          <span className="text-gray-400">{beforeMatch}</span>
          <span className="text-gray-900">{match}</span>
          <span className="text-gray-400">{afterMatch}</span>
        </>
      )
    }

    // If no exact substring match, try subsequence matching
    const matchIndices: number[] = []
    let searchIndex = 0
    for (let i = 0; i < valueLower.length && searchIndex < searchLower.length; i++) {
      if (valueLower[i] === searchLower[searchIndex]) {
        matchIndices.push(i)
        searchIndex++
      }
    }

    // If we found a subsequence match, highlight those characters
    if (matchIndices.length === searchLower.length) {
      const parts: React.ReactNode[] = []
      let lastIndex = 0

      matchIndices.forEach((matchIndex, i) => {
        // Add non-matching part before this match
        if (matchIndex > lastIndex) {
          parts.push(
            <span key={`before-${i}`} className="text-gray-400">
              {selectedValue.substring(lastIndex, matchIndex)}
            </span>
          )
        }

        // Add matching character
        parts.push(
          <span key={`match-${i}`} className="text-gray-900">
            {selectedValue.substring(matchIndex, matchIndex + 1)}
          </span>
        )

        lastIndex = matchIndex + 1
      })

      // Add remaining non-matching part
      if (lastIndex < selectedValue.length) {
        parts.push(
          <span key="after" className="text-gray-400">
            {selectedValue.substring(lastIndex)}
          </span>
        )
      }

      return <>{parts}</>
    }

    // If no match found, return the search term
    return searchTerm
  }

  if (!selectedValue || !searchTerm.trim()) {
    return null
  }

  return (
    <div className={`absolute top-full left-0 right-0 mt-1 px-2 py-1 text-sm bg-gray-50 border border-gray-200 rounded shadow-sm pointer-events-none ${className}`}>
      <div className="font-mono text-gray-600">
        {getPreviewText()}
      </div>
    </div>
  )
}
