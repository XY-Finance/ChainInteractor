'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useWalletManager } from '../../hooks/useWalletManager'
import { WalletSelector } from '../wallet'
import { NetworkSelector } from '../ui'

// Memoized component to prevent unnecessary re-renders
const GlobalWalletManager = React.memo(function GlobalWalletManager() {
  const {
    isConnected,
    currentAccount,
    switchWallet,
    disconnectWallet,
    isLoading,
    availableWallets
  } = useWalletManager()

  // Wallet dropdown states
  const [showWalletDropdown, setShowWalletDropdown] = useState(false)
  const [showAccountOptions, setShowAccountOptions] = useState(false)
  const [switchingAccount, setSwitchingAccount] = useState<{type: string, index: number} | null>(null)

  // Memoized click outside handler
  const handleClickOutside = useCallback((event: MouseEvent) => {
    const target = event.target as Element
    if (!target.closest('.wallet-dropdown')) {
      setShowWalletDropdown(false)
      setShowAccountOptions(false)
    }
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [handleClickOutside])

  // Memoized disconnect handler
  const handleDisconnect = useCallback(async () => {
    try {
      await disconnectWallet()
      setShowWalletDropdown(false)
      setShowAccountOptions(false)
    } catch (error) {
      console.error('Failed to disconnect:', error)
    }
  }, [disconnectWallet])

  // Toggle wallet dropdown
  const toggleWalletDropdown = useCallback(() => {
    setShowWalletDropdown(prev => !prev)
  }, [])

  return (
    <div className="wallet-dropdown relative">
      {/* Wallet Status Display */}
      <div className="flex items-center space-x-4">
        {/* Network Selector */}
        <NetworkSelector />

        {/* Wallet Dropdown Toggle */}
        <button
          onClick={toggleWalletDropdown}
          className="flex items-center space-x-2 px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors"
        >
          <span className="text-lg">
            {isConnected ? (currentAccount?.type === 'local-key' ? '🔑' : '🦊') : '🔗'}
          </span>
          <div className="text-left">
            {isConnected ? (
              <>
                <div className="text-sm font-medium text-gray-900">
                  {currentAccount?.address?.slice(0, 6)}...{currentAccount?.address?.slice(-4)}
                </div>
                <div className="text-xs text-gray-500">
                  {currentAccount?.type === 'local-key' ? 'Local Key' : 'MetaMask'}
                  {currentAccount?.keyIndex !== undefined && ` #${currentAccount.keyIndex}`}
                </div>
              </>
            ) : (
              <div className="text-sm font-medium text-gray-900">Connect Wallet</div>
            )}
          </div>
          <span className="opacity-70">▼</span>
        </button>
      </div>

      {/* Wallet Selector Dropdown */}
      {showWalletDropdown && (
        <div className="absolute right-0 top-full mt-1 w-96 bg-white border border-gray-300 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto transform -translate-x-1/4">
          <div className="p-4">
            <WalletSelector />
          </div>
        </div>
      )}
    </div>
  )
})

export default GlobalWalletManager
