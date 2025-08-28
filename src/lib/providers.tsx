'use client'

import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RainbowKitProvider } from '@rainbow-me/rainbowkit'
import { config } from '../config/config'
import { WalletProvider } from '../contexts/WalletContext'
import { useState, useEffect } from 'react'
import { PageSkeleton } from '../components/ui/PageSkeleton'

export function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        retry: 1,
      },
    },
  }))

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <PageSkeleton />
  }

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <WalletProvider>
            {children}
          </WalletProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
