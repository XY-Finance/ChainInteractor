'use client'

import React, { useState, useEffect } from 'react'
import { useWalletManager } from '../../hooks/useWalletManager'
import { type WalletType } from '../../types/wallet'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'

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
    clearError
  } = useWalletManager()

  const [availableKeys, setAvailableKeys] = useState<Array<{index: number, address: string}>>([])
  const [showKeySelector, setShowKeySelector] = useState(false)

  // Load available keys when component mounts
  useEffect(() => {
    const loadKeys = async () => {
      try {
        console.log('🔧 Loading available keys...')
        const keys = await getAvailableKeys()
        console.log('📋 Loaded keys:', keys)
        setAvailableKeys(keys)
      } catch (err) {
        console.error('Failed to load available keys:', err)
      }
    }
    loadKeys()
  }, [getAvailableKeys])

      const handleConnect = async (type: WalletType) => {
    try {
      if (type === 'local-key') {
        // For local key wallet, always check if we have multiple keys
        if (availableKeys.length > 1) {
          setShowKeySelector(true)
        } else if (availableKeys.length === 1) {
          await connectWallet(type, 0) // Connect to the first (and only) key
        } else {
          // Try to load keys first, then check again
          const keys = await getAvailableKeys()
          if (keys.length > 1) {
            setAvailableKeys(keys)
            setShowKeySelector(true)
          } else if (keys.length === 1) {
            await connectWallet(type, 0)
          } else {
            throw new Error('No local keys available')
          }
        }
      } else {
        await connectWallet(type)
      }
    } catch (err) {
      console.error('Failed to connect wallet:', err)
    }
  }

  const handleConnectWithKey = async (keyIndex: number) => {
    try {
      await connectWallet('local-key', keyIndex)
      setShowKeySelector(false)
    } catch (err) {
      console.error('Failed to connect with key:', err)
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
      await switchWallet(type)
    } catch (err) {
      console.error('Failed to switch wallet:', err)
    }
  }

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-4">Wallet Connection</h2>

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

      {showKeySelector ? (
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
            <h3 className="font-medium text-blue-800 mb-3">Select Private Key</h3>
            <p className="text-sm text-blue-600 mb-4">
              Multiple private keys found. Choose which one to connect with:
            </p>
            <div className="space-y-2">
              {availableKeys.map((key) => (
                <div
                  key={key.index}
                  className="p-3 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleConnectWithKey(key.index)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Key #{key.index}</p>
                      <p className="text-xs text-gray-600 font-mono">
                        {key.address}
                      </p>
                    </div>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleConnectWithKey(key.index)
                      }}
                      size="sm"
                    >
                      Connect
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <Button
              onClick={() => setShowKeySelector(false)}
              variant="outline"
              size="sm"
              className="mt-3"
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : isConnected ? (
        <div className="space-y-4">
          <div className="p-4 bg-green-50 border border-green-200 rounded-md">
            <h3 className="font-medium text-green-800">Connected</h3>
            <p className="text-sm text-green-600 mt-1">
              Address: {currentAccount?.address}
            </p>
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
            >
              {isLoading ? 'Disconnecting...' : 'Disconnect'}
            </Button>
          </div>

          <div className="border-t pt-4">
            <h4 className="font-medium mb-2">Switch Wallet</h4>
            <div className="flex flex-wrap gap-2">
              {availableWallets
                .filter(wallet => wallet.isAvailable && wallet.type !== currentAccount?.type)
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
        <div className="space-y-4">
          <p className="text-gray-600 text-sm">
            Choose a wallet type to connect:
          </p>

          <div className="grid gap-3">
                        {availableWallets.map(wallet => (
              <div
                key={wallet.type}
                className={`p-4 border rounded-md ${
                  wallet.isAvailable
                    ? 'border-gray-200 hover:border-gray-300 cursor-pointer'
                    : 'border-gray-100 bg-gray-50 cursor-not-allowed'
                }`}
                onClick={() => wallet.isAvailable && handleConnect(wallet.type)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">{wallet.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {wallet.description}
                    </p>
                    {wallet.type === 'local-key' && availableKeys.length > 0 && (
                      <p className="text-xs text-blue-600 mt-1">
                        {availableKeys.length} key{availableKeys.length > 1 ? 's' : ''} available
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {wallet.isAvailable ? (
                      <Button
                        onClick={() => handleConnect(wallet.type)}
                        disabled={isLoading}
                        size="sm"
                      >
                        {isLoading ? 'Connecting...' : 'Connect'}
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
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-yellow-800 text-sm">
                No wallets are currently available. Make sure you have:
              </p>
              <ul className="text-yellow-700 text-sm mt-2 list-disc list-inside space-y-1">
                <li>Set up your PRIVATE_KEY in .env file for environment wallet</li>
                <li>Installed MetaMask or similar for injected wallet</li>
                <li>Configured embedded wallet provider</li>
              </ul>
            </div>
          )}
        </div>
      )}
    </Card>
  )
}
