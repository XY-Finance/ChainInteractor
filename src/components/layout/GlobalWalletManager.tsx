'use client'

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useWalletManager } from '../../hooks/useWalletManager'
import { WalletSelector } from '../wallet'
import { NetworkSelector } from '../ui'

// Memoized component to prevent unnecessary re-renders
const GlobalWalletManager = React.memo(function GlobalWalletManager() {
  const {
    isConnected,
    currentAccount,
    getAvailableKeys,
    areLocalKeysAvailable,
    switchWallet,
    disconnectWallet,
    isLoading,
    getAvailableInjectedAccounts,
    connectWallet
  } = useWalletManager()

  // Wallet dropdown states
  const [showWalletDropdown, setShowWalletDropdown] = useState(false)
  const [showAccountOptions, setShowAccountOptions] = useState(false)
  const [availableKeys, setAvailableKeys] = useState<Array<{index: number, address: string}>>([])
  const [availableInjectedAccounts, setAvailableInjectedAccounts] = useState<Array<{index: number, address: string}>>([])
  const [switchingAccount, setSwitchingAccount] = useState<{type: string, index: number} | null>(null)
  const [hasAttemptedAutoConnect, setHasAttemptedAutoConnect] = useState(false)

  // Memoized auto-connect function to prevent recreation
  const autoConnect = useCallback(async () => {
    if (!isConnected && !isLoading && !hasAttemptedAutoConnect) {
      try {
        console.log('🔗 Auto-connecting to KEY0...')
        setHasAttemptedAutoConnect(true)

        // Wait for local keys to be available (with retry)
        let keysAvailable = false
        let retryCount = 0
        const maxRetries = 10

        while (!keysAvailable && retryCount < maxRetries) {
          keysAvailable = await areLocalKeysAvailable()
          if (!keysAvailable) {
            console.log(`⏳ Waiting for keys to load... (attempt ${retryCount + 1}/${maxRetries})`)
            await new Promise(resolve => setTimeout(resolve, 500)) // Wait 500ms
            retryCount++
          }
        }

        if (!keysAvailable) {
          console.log('⚠️ Local keys not available after retries, skipping auto-connection')
          return
        }

        console.log('✅ Keys loaded, attempting connection...')
        await connectWallet('local-key', 0)
        console.log('✅ Auto-connected to KEY0 successfully')
      } catch (error) {
        console.log('⚠️ Auto-connection to KEY0 failed:', error)
        // Don't show error to user, just log it
      }
    }
  }, [isConnected, isLoading, hasAttemptedAutoConnect, areLocalKeysAvailable, connectWallet])

  // Auto-connect to KEY0 on component mount - use ref to prevent unnecessary re-runs
  const hasAutoConnectedRef = useRef(false)

  // Auto-connect to KEY0 on component mount
  useEffect(() => {
    if (!hasAutoConnectedRef.current) {
      hasAutoConnectedRef.current = true
      autoConnect()
    }
  }, [autoConnect])

  // Memoized load accounts function
  const loadAccounts = useCallback(async () => {
    if (isConnected) {
      try {
        console.log('🔍 Loading available accounts...')

        // Load local keys
        const localKeys = await getAvailableKeys()
        console.log('📋 Loaded local keys:', localKeys)
        setAvailableKeys(localKeys)

        // Load injected accounts (MetaMask) - handle gracefully if not available
        try {
          const injectedAccounts = await getAvailableInjectedAccounts()
          console.log('📋 Loaded injected accounts:', injectedAccounts)
          setAvailableInjectedAccounts(injectedAccounts)
        } catch (injectedError) {
          console.log('📋 No injected wallet available, skipping injected accounts')
          setAvailableInjectedAccounts([])
        }
      } catch (err) {
        console.error('Failed to load available accounts:', err)
      }
    }
  }, [isConnected, getAvailableKeys, getAvailableInjectedAccounts])

  // Load available keys and accounts when component mounts or when connected - use ref to prevent unnecessary re-runs
  const lastLoadAccountsRef = useRef<{ isConnected: boolean }>({ isConnected: false })

  // Load available keys and accounts when component mounts or when connected
  useEffect(() => {
    if (lastLoadAccountsRef.current.isConnected !== isConnected) {
      lastLoadAccountsRef.current.isConnected = isConnected
      loadAccounts()
    }
  }, [loadAccounts, isConnected])

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

  // Memoized switch account handler
  const handleSwitchAccount = useCallback(async (type: string, index: number) => {
    if (switchingAccount) return // Prevent multiple simultaneous switches

    setSwitchingAccount({ type, index })
    try {
      await switchWallet(type as any, index)
      setShowAccountOptions(false)
    } catch (error) {
      console.error('Failed to switch account:', error)
    } finally {
      setSwitchingAccount(null)
    }
  }, [switchingAccount, switchWallet])

  // Memoized disconnect handler
  const handleDisconnect = useCallback(async () => {
    try {
      await disconnectWallet()
      setShowWalletDropdown(false)
    } catch (error) {
      console.error('Failed to disconnect:', error)
    }
  }, [disconnectWallet])

  // Memoized dropdown toggle handlers
  const toggleWalletDropdown = useCallback(() => {
    setShowWalletDropdown(prev => !prev)
    setShowAccountOptions(false)
  }, [])

  const toggleAccountOptions = useCallback(() => {
    setShowAccountOptions(prev => !prev)
  }, [])

  // Memoized computed values
  const displayAddress = useMemo(() => {
    if (!currentAccount?.address) return 'Not Connected'
    return `${currentAccount.address.slice(0, 6)}...${currentAccount.address.slice(-4)}`
  }, [currentAccount?.address])

  const walletTypeDisplay = useMemo(() => {
    if (!currentAccount?.type) return ''
    return currentAccount.type === 'local-key' ? 'Local Key' : 'Injected'
  }, [currentAccount?.type])

  const isSwitching = useMemo(() => {
    return switchingAccount !== null
  }, [switchingAccount])

  const switchingText = useMemo(() => {
    if (!switchingAccount) return ''
    return `Switching to ${switchingAccount.type} ${switchingAccount.index}...`
  }, [switchingAccount])

  // Memoized account options
  const accountOptions = useMemo(() => {
    const options = []

    // Local key accounts
    if (availableKeys.length > 0) {
      options.push(
        <div key="local-keys" className="mb-2">
          <div className="text-xs font-medium text-gray-500 mb-1 px-2">Local Keys</div>
          {availableKeys.map((key) => (
            <button
              key={`local-${key.index}`}
              onClick={() => handleSwitchAccount('local-key', key.index)}
              disabled={isSwitching || (currentAccount?.type === 'local-key' && currentAccount?.keyIndex === key.index)}
              className={`w-full flex items-center space-x-2 px-3 py-2 rounded-md text-left transition-colors ${
                currentAccount?.type === 'local-key' && currentAccount?.keyIndex === key.index
                  ? 'bg-blue-50 text-blue-700'
                  : 'hover:bg-gray-50 text-gray-700'
              }`}
            >
              <span className="text-sm">🔑</span>
              <div className="flex-1">
                <div className="text-sm font-medium">KEY{key.index}</div>
                <div className="text-xs text-gray-500">{key.address}</div>
              </div>
              {currentAccount?.type === 'local-key' && currentAccount?.keyIndex === key.index && (
                <span className="text-blue-600">✓</span>
              )}
              {isSwitching && switchingAccount?.type === 'local-key' && switchingAccount?.index === key.index && (
                <span className="text-gray-400">⏳</span>
              )}
            </button>
          ))}
        </div>
      )
    }

    // Injected accounts
    if (availableInjectedAccounts.length > 0) {
      options.push(
        <div key="injected-accounts" className="mb-2">
          <div className="text-xs font-medium text-gray-500 mb-1 px-2">Injected Wallet</div>
          {availableInjectedAccounts.map((account) => (
            <button
              key={`injected-${account.index}`}
              onClick={() => handleSwitchAccount('injected', account.index)}
              disabled={isSwitching || (currentAccount?.type === 'injected' && currentAccount?.keyIndex === account.index)}
              className={`w-full flex items-center space-x-2 px-3 py-2 rounded-md text-left transition-colors ${
                currentAccount?.type === 'injected' && currentAccount?.keyIndex === account.index
                  ? 'bg-blue-50 text-blue-700'
                  : 'hover:bg-gray-50 text-gray-700'
              }`}
            >
              <span className="text-sm">🦊</span>
              <div className="flex-1">
                <div className="text-sm font-medium">Account {account.index}</div>
                <div className="text-xs text-gray-500">{account.address}</div>
              </div>
              {currentAccount?.type === 'injected' && currentAccount?.keyIndex === account.index && (
                <span className="text-blue-600">✓</span>
              )}
              {isSwitching && switchingAccount?.type === 'injected' && switchingAccount?.index === account.index && (
                <span className="text-gray-400">⏳</span>
              )}
            </button>
          ))}
        </div>
      )
    }

    return options
  }, [
    availableKeys,
    availableInjectedAccounts,
    currentAccount,
    isSwitching,
    switchingAccount,
    handleSwitchAccount
  ])

  if (!isConnected) {
    return (
      <div className="flex items-center space-x-4">
        <WalletSelector />
        <NetworkSelector />
      </div>
    )
  }

  return (
    <div className="flex items-center space-x-4">
      {/* Wallet Dropdown */}
      <div className="relative wallet-dropdown">
        <button
          onClick={toggleWalletDropdown}
          className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors"
          disabled={isLoading}
        >
          <div className="flex items-center space-x-2">
            <span className="text-lg">
              {currentAccount?.type === 'local-key' ? '🔑' : '🦊'}
            </span>
            <div className="text-left">
              <div className="text-sm font-medium text-gray-900">{displayAddress}</div>
              <div className="text-xs text-gray-500">{walletTypeDisplay}</div>
            </div>
          </div>
          <span className="opacity-70">
            {isLoading ? '⏳' : '▼'}
          </span>
        </button>

        {/* Wallet Dropdown Menu */}
        {showWalletDropdown && (
          <div className="absolute top-full left-0 mt-1 w-80 bg-white border border-gray-300 rounded-lg shadow-lg z-50">
            <div className="p-2">
              {/* Current Account Info */}
              <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded-md">
                <div className="text-xs font-medium text-blue-800 mb-1">Current Account</div>
                <div className="text-sm text-blue-900">{displayAddress}</div>
                <div className="text-xs text-blue-700">{walletTypeDisplay}</div>
              </div>

              {/* Account Options */}
              <div className="mb-3">
                <div className="text-xs font-medium text-gray-500 mb-2 px-2">Switch Account</div>
                {accountOptions}
              </div>

              {/* Disconnect Button */}
              <button
                onClick={handleDisconnect}
                className="w-full flex items-center justify-center space-x-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
              >
                <span>🚪</span>
                <span className="text-sm font-medium">Disconnect</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Network Selector */}
      <NetworkSelector />

      {/* Loading Indicator */}
      {isLoading && (
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-600"></div>
          <span>Loading...</span>
        </div>
      )}

      {/* Switching Indicator */}
      {isSwitching && (
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <span>{switchingText}</span>
        </div>
      )}
    </div>
  )
})

export default GlobalWalletManager
