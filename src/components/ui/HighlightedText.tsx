import React from 'react'

interface HighlightedTextProps {
  text: string
  highlights: number[][]
  className?: string
  highlightClassName?: string
}

export const HighlightedText: React.FC<HighlightedTextProps> = ({
  text,
  highlights,
  className = '',
  highlightClassName = 'bg-yellow-200 font-medium'
}) => {
  // If no highlights, return plain text
  if (!highlights || highlights.length === 0) {
    return <span className={className}>{text}</span>
  }

  // Sort highlights by start position to ensure proper rendering order
  const sortedHighlights = [...highlights].sort((a, b) => a[0] - b[0])

  const result: React.ReactNode[] = []
  let lastIndex = 0

  sortedHighlights.forEach(([start, end], index) => {
    // Add text before highlight
    if (start > lastIndex) {
      result.push(
        <span key={`text-${index}`}>
          {text.slice(lastIndex, start)}
        </span>
      )
    }

    // Add highlighted text
    result.push(
      <mark key={`highlight-${index}`} className={highlightClassName}>
        {text.slice(start, end + 1)}
      </mark>
    )

    lastIndex = end + 1
  })

  // Add remaining text after last highlight
  if (lastIndex < text.length) {
    result.push(
      <span key="text-end">
        {text.slice(lastIndex)}
      </span>
    )
  }

  return <span className={className}>{result}</span>
}

export default HighlightedText
