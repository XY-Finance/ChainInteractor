import React from 'react'

interface ScrollableGridProps {
  children: React.ReactNode
  maxHeight?: string
  gridCols?: {
    default: string
    md?: string
    lg?: string
    xl?: string
  }
  gap?: string
  className?: string
}

export const ScrollableGrid: React.FC<ScrollableGridProps> = ({
  children,
  maxHeight = 'max-h-96',
  gridCols = {
    default: 'grid-cols-1',
    md: 'md:grid-cols-2',
    lg: 'lg:grid-cols-3'
  },
  gap = 'gap-4',
  className = ''
}) => {
  const gridClasses = [
    'grid',
    gridCols.default,
    gridCols.md,
    gridCols.lg,
    gridCols.xl,
    gap
  ].filter(Boolean).join(' ')

  return (
    <div className={`${maxHeight} overflow-y-auto scrollbar-hide ${className}`}>
      <div className={gridClasses}>
        {children}
      </div>
    </div>
  )
}

export default ScrollableGrid
