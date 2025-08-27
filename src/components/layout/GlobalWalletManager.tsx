'use client'

import { useState, useEffect } from 'react'
import { useWalletManager } from '../../hooks/useWalletManager'
import { WalletSelector } from '../wallet'
import { NetworkSelector } from '../ui'

export default function GlobalWalletManager() {
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

  // Auto-connect to KEY0 on component mount
  useEffect(() => {
    const autoConnect = async () => {
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
    }
    autoConnect()
  }, [isConnected, isLoading, connectWallet, areLocalKeysAvailable, hasAttemptedAutoConnect])

  // Load available keys and accounts when component mounts or when connected
  useEffect(() => {
    const loadAccounts = async () => {
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
    }
    loadAccounts()
  }, [isConnected, getAvailableKeys, getAvailableInjectedAccounts])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (!target.closest('.wallet-dropdown')) {
        setShowWalletDropdown(false)
        setShowAccountOptions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleSwitchAccount = async (type: string, index: number) => {
    try {
      setSwitchingAccount({ type, index })
      console.log(`🔄 Switching to ${type} account ${index}...`)

      // Switch to the specified wallet type and account
      await switchWallet(type as any, index)

      console.log(`✅ Successfully switched to ${type} account ${index}`)
      setShowAccountOptions(false)
      setShowWalletDropdown(false)
    } catch (err) {
      console.error('Failed to switch account:', err)
      // You could add a toast notification here
      alert(`Failed to switch account: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setSwitchingAccount(null)
    }
  }

  const handleDisconnect = async () => {
    try {
      await disconnectWallet()
      setShowWalletDropdown(false)
      // Reset auto-connect flag when user manually disconnects
      setHasAttemptedAutoConnect(false)
    } catch (err) {
      console.error('Failed to disconnect wallet:', err)
    }
  }

  return (
    <div className="flex items-center space-x-4">
      {/* Network Selector - Only show when connected */}
      {isConnected && (
        <div className="hidden sm:block">
          <NetworkSelector />
        </div>
      )}

      {/* Wallet Dropdown */}
      <div className="relative wallet-dropdown">
        <button
          onClick={() => {
            setShowWalletDropdown(!showWalletDropdown)
            setShowAccountOptions(false)
          }}
          className="flex items-center space-x-2 bg-white px-4 py-2 rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-200"
        >
          {isConnected ? (
            <>
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm font-medium text-gray-700">
                {currentAccount?.address?.slice(0, 6)}...{currentAccount?.address?.slice(-4)}
              </span>
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </>
          ) : (
            <>
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="text-sm font-medium text-gray-700">Connect Wallet</span>
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </>
          )}
        </button>

        {/* Wallet Dropdown */}
        {showWalletDropdown && (
          <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
            <div className="p-4">
              {!isConnected ? (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Connect Wallet</h3>
                  <WalletSelector />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">Wallet Connected</h3>
                    <button
                      onClick={() => setShowWalletDropdown(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  {/* Network Selector - Show in dropdown on mobile */}
                  <div className="sm:hidden">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Network</label>
                    <NetworkSelector />
                  </div>

                  {/* Current Account Info */}
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-sm font-medium text-gray-900">Current Account</p>
                    <div className="group relative">
                      <p className="text-xs text-gray-600 font-mono mt-1 overflow-hidden text-ellipsis whitespace-nowrap" title={currentAccount?.address}>
                        {currentAccount?.address}
                      </p>
                      {/* Tooltip for full address */}
                      <div className="absolute left-0 bottom-full mb-1 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                        {currentAccount?.address}
                        <div className="absolute top-full left-4 w-0 h-0 border-l-2 border-r-2 border-t-2 border-b-0 border-transparent border-t-gray-900"></div>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Type: {currentAccount?.type}
                    </p>
                  </div>

                  {/* Account Switching */}
                  {(availableKeys.length > 1 || availableInjectedAccounts.length > 1) && (
                    <div className="space-y-2">
                      <button
                        onClick={() => {
                          setShowAccountOptions(!showAccountOptions)
                        }}
                        className="w-full flex items-center justify-between bg-blue-50 text-blue-700 px-3 py-2 rounded-md hover:bg-blue-100 transition-colors"
                      >
                        <span className="text-sm font-medium">Switch Account</span>
                        <svg
                          className={`w-4 h-4 transition-transform ${showAccountOptions ? 'rotate-180' : ''}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>

                                             {showAccountOptions && (
                         <div className="bg-gray-50 rounded-md p-3 space-y-4">
                           {/* Local Keys Section */}
                           {availableKeys.length > 1 && (
                             <div className="space-y-2">
                               <p className="text-xs text-gray-600 font-medium">Available Private Keys:</p>
                               <div className="space-y-1">
                                 {availableKeys.map((key) => (
                                   <button
                                     key={`local-${key.index}`}
                                     onClick={() => handleSwitchAccount('local-key', key.index)}
                                     disabled={isLoading || (switchingAccount?.type === 'local-key' && switchingAccount?.index === key.index)}
                                     className="w-full text-left text-xs text-gray-700 hover:bg-gray-100 px-2 py-1 rounded disabled:opacity-50 disabled:cursor-not-allowed group relative"
                                     title={key.address}
                                   >
                                     <div className="overflow-hidden text-ellipsis whitespace-nowrap">
                                       {switchingAccount?.type === 'local-key' && switchingAccount?.index === key.index ? (
                                         <>⏳ Switching to Key #{key.index}...</>
                                       ) : (
                                         <>
                                           🔑 Key #{key.index} ({key.address.slice(0, 6)}...{key.address.slice(-4)})
                                           {currentAccount?.type === 'local-key' && currentAccount?.keyIndex === key.index && (
                                             <span className="text-green-600 ml-1">✓</span>
                                           )}
                                         </>
                                       )}
                                     </div>
                                     {/* Tooltip for full address */}
                                     <div className="absolute left-full ml-2 top-1/2 transform -translate-y-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                                       {key.address}
                                       <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 w-0 h-0 border-l-0 border-r-4 border-t-2 border-b-2 border-transparent border-r-gray-900"></div>
                                     </div>
                                   </button>
                                 ))}
                               </div>
                             </div>
                           )}

                           {/* Injected Accounts Section */}
                           {availableInjectedAccounts.length > 1 && (
                             <div className="space-y-2">
                               <p className="text-xs text-gray-600 font-medium">Available MetaMask Accounts:</p>
                               <div className="space-y-1">
                                 {availableInjectedAccounts.map((account) => (
                                   <button
                                     key={`injected-${account.index}`}
                                     onClick={() => handleSwitchAccount('injected', account.index)}
                                     disabled={isLoading || (switchingAccount?.type === 'injected' && switchingAccount?.index === account.index)}
                                     className="w-full text-left text-xs text-gray-700 hover:bg-gray-100 px-2 py-1 rounded disabled:opacity-50 disabled:cursor-not-allowed group relative"
                                     title={account.address}
                                   >
                                     <div className="overflow-hidden text-ellipsis whitespace-nowrap">
                                       {switchingAccount?.type === 'injected' && switchingAccount?.index === account.index ? (
                                         <>⏳ Switching to Account #{account.index}...</>
                                       ) : (
                                         <>
                                           👤 Account #{account.index} ({account.address.slice(0, 6)}...{account.address.slice(-4)})
                                           {currentAccount?.type === 'injected' && currentAccount?.address === account.address && (
                                             <span className="text-green-600 ml-1">✓</span>
                                           )}
                                         </>
                                       )}
                                     </div>
                                     {/* Tooltip for full address */}
                                     <div className="absolute left-full ml-2 top-1/2 transform -translate-y-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                                       {account.address}
                                       <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 w-0 h-0 border-l-0 border-r-4 border-t-2 border-b-2 border-transparent border-r-gray-900"></div>
                                     </div>
                                   </button>
                                 ))}
                               </div>
                             </div>
                           )}
                         </div>
                       )}
                    </div>
                  )}

                  {/* Disconnect Button */}
                  <button
                    onClick={handleDisconnect}
                    disabled={isLoading}
                    className="w-full bg-red-50 text-red-700 px-3 py-2 rounded-md hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Disconnecting...' : 'Disconnect Wallet'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
