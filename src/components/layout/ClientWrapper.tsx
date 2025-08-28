'use client'

import { useState, useEffect } from 'react'
import { PageSkeleton } from '../ui/PageSkeleton'

export function ClientWrapper({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // Use a small delay to ensure all providers are properly initialized
    const timer = setTimeout(() => {
      setMounted(true)
    }, 100)

    return () => clearTimeout(timer)
  }, [])

  if (!mounted) {
    return <PageSkeleton />
  }

  return <>{children}</>
}
