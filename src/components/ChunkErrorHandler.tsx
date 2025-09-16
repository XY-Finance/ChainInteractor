'use client'

import { useEffect } from 'react'
import { setupChunkErrorHandling } from '../utils/chunkErrorHandler'

/**
 * ChunkErrorHandler Component
 *
 * This component sets up global error handling for ChunkLoadErrors
 * and should be included in the root layout of your application.
 */
export function ChunkErrorHandler() {
  useEffect(() => {
    // Set up chunk error handling when the component mounts
    setupChunkErrorHandling()
  }, [])

  // This component doesn't render anything
  return null
}
