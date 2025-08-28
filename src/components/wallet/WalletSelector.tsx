'use client'

import React, { useState, useEffect } from 'react'
import { useWalletManager } from '../../hooks/useWalletManager'
import { type WalletType } from '../../types/wallet'
import { Button } from '../ui/Button'

export function WalletSelector() {
  const {
    isConnected,
    currentAccount,
    availableWallets,
    isLoading,
    error,
    connectWallet,
    disconnectWallet,
    switchWallet,
    getAvailableKeys,
    getAvailableInjectedAccounts,
    getAllAvailableAccounts,
    clearError
  } = useWalletManager()

  const [availableKeys, setAvailableKeys] = useState<Array<{index: number, address: string}>>([])
  const [availableInjectedAccounts, setAvailableInjectedAccounts] = useState<Array<{index: number, address: string}>>([])
  const [showAccountSelector, setShowAccountSelector] = useState(false)
  const [selectedWalletType, setSelectedWalletType] = useState<WalletType | null>(null)
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(false)

  // Load all available accounts when component mounts
  useEffect(() => {
    const loadAccounts = async () => {
      try {
        setIsLoadingAccounts(true)
        console.log('🔧 Loading all available accounts...')
        const { localKeys, injectedAccounts } = await getAllAvailableAccounts()
        console.log('📋 Loaded local keys:', localKeys)
        console.log('📋 Loaded injected accounts:', injectedAccounts)
        setAvailableKeys(localKeys)
        setAvailableInjectedAccounts(injectedAccounts)
      } catch (err) {
        console.error('Failed to load available accounts:', err)
      } finally {
        setIsLoadingAccounts(false)
      }
    }
    loadAccounts()
  }, [getAllAvailableAccounts])

  const handleConnect = async (type: WalletType) => {
    try {
      setSelectedWalletType(type)

      if (type === 'local-key') {
        // For local key wallet, check if we have multiple keys
        if (availableKeys.length > 1) {
          setShowAccountSelector(true)
        } else if (availableKeys.length === 1) {
          await connectWallet(type, 0) // Connect to the first (and only) key
        } else {
          // Try to load keys first, then check again
          const { localKeys } = await getAllAvailableAccounts()
          if (localKeys.length > 1) {
            setAvailableKeys(localKeys)
            setShowAccountSelector(true)
          } else if (localKeys.length === 1) {
            await connectWallet(type, 0)
          } else {
            throw new Error('No local keys available')
          }
        }
      } else if (type === 'injected') {
        // For injected wallet, check if we have multiple accounts
        if (availableInjectedAccounts.length > 1) {
          setShowAccountSelector(true)
        } else if (availableInjectedAccounts.length === 1) {
          await connectWallet(type, 0) // Connect to the first account
        } else {
          // Try to load accounts first, then check again
          const { injectedAccounts } = await getAllAvailableAccounts()
          if (injectedAccounts.length > 1) {
            setAvailableInjectedAccounts(injectedAccounts)
            setShowAccountSelector(true)
          } else if (injectedAccounts.length === 1) {
            await connectWallet(type, 0)
          } else {
            await connectWallet(type) // Let the wallet handle account selection
          }
        }
      } else {
        await connectWallet(type)
      }
    } catch (err) {
      console.error('Failed to connect wallet:', err)
    }
  }

  const handleConnectWithAccount = async (keyIndex: number) => {
    try {
      if (selectedWalletType === 'local-key') {
        await connectWallet('local-key', keyIndex)
      } else if (selectedWalletType === 'injected') {
        await connectWallet('injected', keyIndex)
      }
      setShowAccountSelector(false)
      setSelectedWalletType(null)
    } catch (err) {
      console.error('Failed to connect with account:', err)
    }
  }

  const handleDisconnect = async () => {
    try {
      await disconnectWallet()
    } catch (err) {
      console.error('Failed to disconnect wallet:', err)
    }
  }

  const handleSwitchWallet = async (type: WalletType) => {
    try {
      setSelectedWalletType(type)

      if (type === 'local-key') {
        // For local key wallet, check if we have multiple keys
        if (availableKeys.length > 1) {
          setShowAccountSelector(true)
        } else if (availableKeys.length === 1) {
          await switchWallet(type, 0)
        } else {
          // Try to load keys first, then check again
          const { localKeys } = await getAllAvailableAccounts()
          if (localKeys.length > 1) {
            setAvailableKeys(localKeys)
            setShowAccountSelector(true)
          } else if (localKeys.length === 1) {
            await switchWallet(type, 0)
          } else {
            throw new Error('No local keys available')
          }
        }
      } else if (type === 'injected') {
        // For injected wallet, check if we have multiple accounts
        if (availableInjectedAccounts.length > 1) {
          setShowAccountSelector(true)
        } else if (availableInjectedAccounts.length === 1) {
          await switchWallet(type, 0)
        } else {
          // Try to load accounts first, then check again
          const { injectedAccounts } = await getAllAvailableAccounts()
          if (injectedAccounts.length > 1) {
            setAvailableInjectedAccounts(injectedAccounts)
            setShowAccountSelector(true)
          } else if (injectedAccounts.length === 1) {
            await switchWallet(type, 0)
          } else {
            await switchWallet(type) // Let the wallet handle account selection
          }
        }
      } else {
        await switchWallet(type)
      }
    } catch (err) {
      console.error('Failed to switch wallet:', err)
    }
  }

  const getAccountList = () => {
    if (selectedWalletType === 'local-key') {
      return availableKeys.map(key => ({
        index: key.index,
        address: key.address,
        label: `Local Key #${key.index}`
      }))
    } else if (selectedWalletType === 'injected') {
      return availableInjectedAccounts.map(account => ({
        index: account.index,
        address: account.address,
        label: `MetaMask Account #${account.index}`
      }))
    }
    return []
  }

  return (
    <div className="w-full">
      <h3 className="text-lg font-semibold mb-3">Wallet Connection</h3>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-700 text-sm">{error}</p>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearError}
            className="mt-2 text-red-600 hover:text-red-800"
          >
            Dismiss
          </Button>
        </div>
      )}

      {showAccountSelector ? (
        <div className="space-y-3">
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
            <h4 className="font-medium text-blue-800 mb-2">
              Select {selectedWalletType === 'local-key' ? 'Private Key' : 'Account'}
            </h4>
            <p className="text-sm text-blue-600 mb-3">
              Multiple {selectedWalletType === 'local-key' ? 'private keys' : 'accounts'} found. Choose which one to connect with:
            </p>
            <div className="space-y-2">
              {getAccountList().map((account) => (
                <div
                  key={account.index}
                  className="p-2 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleConnectWithAccount(account.index)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{account.label}</p>
                      <div className="group relative">
                        <p className="text-xs text-gray-600 font-mono overflow-hidden text-ellipsis whitespace-nowrap" title={account.address}>
                          {account.address}
                        </p>
                        {/* Tooltip for full address */}
                        <div className="absolute left-0 bottom-full mb-1 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                          {account.address}
                          <div className="absolute top-full left-4 w-0 h-0 border-l-2 border-r-2 border-t-2 border-b-0 border-transparent border-t-gray-900"></div>
                        </div>
                      </div>
                    </div>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleConnectWithAccount(account.index)
                      }}
                      size="sm"
                      className="ml-2 flex-shrink-0"
                    >
                      Connect
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <Button
              onClick={() => {
                setShowAccountSelector(false)
                setSelectedWalletType(null)
              }}
              variant="outline"
              size="sm"
              className="mt-3"
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : isConnected ? (
        <div className="space-y-3">
          <div className="p-3 bg-green-50 border border-green-200 rounded-md">
            <h4 className="font-medium text-green-800">Connected</h4>
            <div className="group relative">
              <p className="text-sm text-green-600 mt-1 overflow-hidden text-ellipsis whitespace-nowrap" title={currentAccount?.address}>
                Address: {currentAccount?.address}
              </p>
              {/* Tooltip for full address */}
              <div className="absolute left-0 bottom-full mb-1 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                {currentAccount?.address}
                <div className="absolute top-full left-4 w-0 h-0 border-l-2 border-r-2 border-t-2 border-b-0 border-transparent border-t-gray-900"></div>
              </div>
            </div>
            <p className="text-sm text-green-600">
              Type: {currentAccount?.type}
            </p>
            {currentAccount?.keyIndex !== undefined && (
              <p className="text-sm text-green-600">
                Key Index: {currentAccount.keyIndex}
              </p>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleDisconnect}
              disabled={isLoading}
              variant="outline"
              size="sm"
            >
              {isLoading ? 'Disconnecting...' : 'Disconnect'}
            </Button>
          </div>

          <div className="border-t pt-3">
            <h5 className="font-medium mb-2 text-sm">Switch Wallet</h5>
            <div className="flex flex-wrap gap-2">
              {availableWallets
                .filter(wallet => wallet.isAvailable)
                .map(wallet => (
                  <Button
                    key={wallet.type}
                    onClick={() => handleSwitchWallet(wallet.type)}
                    disabled={isLoading}
                    variant="outline"
                    size="sm"
                  >
                    {wallet.name}
                  </Button>
                ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-gray-600 text-sm">
            Choose a wallet type to connect:
          </p>

          <div className="space-y-2">
            {availableWallets.map(wallet => (
              <div
                key={wallet.type}
                className={`p-3 border rounded-md ${
                  wallet.isAvailable
                    ? 'border-gray-200 hover:border-gray-300 cursor-pointer'
                    : 'border-gray-100 bg-gray-50 cursor-not-allowed'
                }`}
                onClick={() => wallet.isAvailable && handleConnect(wallet.type)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-sm">{wallet.name}</h4>
                    <p className="text-xs text-gray-600 mt-1">
                      {wallet.description}
                    </p>
                    {wallet.type === 'local-key' && availableKeys.length > 0 && (
                      <p className="text-xs text-blue-600 mt-1">
                        {availableKeys.length} key{availableKeys.length > 1 ? 's' : ''} available
                      </p>
                    )}
                    {wallet.type === 'injected' && availableInjectedAccounts.length > 0 && (
                      <p className="text-xs text-blue-600 mt-1">
                        {availableInjectedAccounts.length} account{availableInjectedAccounts.length > 1 ? 's' : ''} available
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {wallet.isAvailable ? (
                      <Button
                        onClick={() => handleConnect(wallet.type)}
                        disabled={isLoading || isLoadingAccounts}
                        size="sm"
                      >
                        {isLoading || isLoadingAccounts ? 'Loading...' : 'Connect'}
                      </Button>
                    ) : (
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        Not Available
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {availableWallets.every(wallet => !wallet.isAvailable) && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-yellow-800 text-sm">
                No wallets are currently available. Make sure you have:
              </p>
              <ul className="text-yellow-700 text-xs mt-2 list-disc list-inside space-y-1">
                <li>Set up your PRIVATE_KEY in .env file for environment wallet</li>
                <li>Installed MetaMask or similar for injected wallet</li>
                <li>Configured embedded wallet provider</li>
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
