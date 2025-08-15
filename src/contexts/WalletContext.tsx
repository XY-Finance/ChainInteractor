'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { WalletManager } from '../lib/wallets/wallet-manager'
import { type WalletType, type WalletAccount, type WalletConfig } from '../types/wallet'

interface WalletContextType {
  // State
  isConnected: boolean
  currentAccount: WalletAccount | null
  isLoading: boolean
  error: string | null
  availableWallets: WalletConfig[]
  capabilities: any

  // Actions
  connectWallet: (type: WalletType, keyIndex?: number) => Promise<WalletAccount>
  disconnectWallet: () => Promise<void>
  switchWallet: (type: WalletType, keyIndex?: number) => Promise<WalletAccount>
  signMessage: (message: string) => Promise<any>
  sendTransaction: (transaction: any) => Promise<any>
  sign7702Authorization: (authorizationData: any) => Promise<any>
  submit7702Authorization: (signedAuthorization: any) => Promise<any>
  createSmartAccount: () => Promise<any>
  sendUserOperation: (userOp: any) => Promise<any>
  getAvailableKeys: () => Promise<any>
  getPublicClient: () => any
  getWalletClient: () => any
  clearError: () => void

  // Utility
  walletManager: WalletManager
}

const WalletContext = createContext<WalletContextType | undefined>(undefined)

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)
  const [walletManager] = useState(() => new WalletManager())
  const [isConnected, setIsConnected] = useState(false)
  const [currentAccount, setCurrentAccount] = useState<WalletAccount | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [availableWallets, setAvailableWallets] = useState<WalletConfig[]>([])

  // Prevent hydration issues
  useEffect(() => {
    setMounted(true)
  }, [])

  // Load available wallets
  useEffect(() => {
    if (!mounted) return

    const loadWallets = async () => {
      try {
        const wallets = await walletManager.getAvailableWallets()
        setAvailableWallets(wallets)
      } catch (error) {
        console.error('Failed to load available wallets:', error)
      }
    }
    loadWallets()
  }, [walletManager, mounted])

  // Update state from wallet manager
  const updateState = useCallback(() => {
    const status = walletManager.getStatus()
    setIsConnected(status.isConnected)
    setCurrentAccount(status.currentAddress ? {
      address: status.currentAddress,
      type: status.currentWalletType!,
      isConnected: status.isConnected
    } : null)
  }, [walletManager])

  // Connect to wallet
  const connectWallet = useCallback(async (type: WalletType, keyIndex?: number) => {
    setIsLoading(true)
    setError(null)

    try {
      const account = await walletManager.connectWallet(type, keyIndex)
      updateState()
      return account
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect wallet'
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [walletManager, updateState])

  // Disconnect wallet
  const disconnectWallet = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      await walletManager.disconnectWallet()
      updateState()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to disconnect wallet'
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [walletManager, updateState])

  // Switch wallet
  const switchWallet = useCallback(async (type: WalletType, keyIndex?: number) => {
    setIsLoading(true)
    setError(null)

    try {
      const account = await walletManager.switchWallet(type)
      updateState()
      return account
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to switch wallet'
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [walletManager, updateState])

  // Wallet operations
  const signMessage = useCallback(async (message: string) => {
    if (!isConnected) {
      throw new Error('No wallet connected')
    }

    setIsLoading(true)
    setError(null)

    try {
      return await walletManager.signMessage(message)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sign message'
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [walletManager, isConnected])

  const sendTransaction = useCallback(async (transaction: any) => {
    if (!isConnected) {
      throw new Error('No wallet connected')
    }

    setIsLoading(true)
    setError(null)

    try {
      return await walletManager.sendTransaction(transaction)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send transaction'
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [walletManager, isConnected])

  const sign7702Authorization = useCallback(async (authorizationData: any) => {
    if (!isConnected) {
      throw new Error('No wallet connected')
    }

    setIsLoading(true)
    setError(null)

    try {
      return await walletManager.sign7702Authorization(authorizationData)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sign 7702 authorization'
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [walletManager, isConnected])

  const submit7702Authorization = useCallback(async (signedAuthorization: any) => {
    if (!isConnected) {
      throw new Error('No wallet connected')
    }

    setIsLoading(true)
    setError(null)

    try {
      return await walletManager.submit7702Authorization(signedAuthorization)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit 7702 authorization'
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [walletManager, isConnected])

  const createSmartAccount = useCallback(async () => {
    if (!isConnected) {
      throw new Error('No wallet connected')
    }

    setIsLoading(true)
    setError(null)

    try {
      return await walletManager.createSmartAccount()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create smart account'
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [walletManager, isConnected])

  const sendUserOperation = useCallback(async (userOp: any) => {
    if (!isConnected) {
      throw new Error('No wallet connected')
    }

    setIsLoading(true)
    setError(null)

    try {
      return await walletManager.sendUserOperation(userOp)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send user operation'
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [walletManager, isConnected])

  // Get wallet capabilities
  const capabilities = walletManager.getCapabilities()

  // Get available keys
  const getAvailableKeys = useCallback(async () => {
    return await walletManager.getAvailableKeys()
  }, [walletManager])

  // Get clients
  const getPublicClient = useCallback(() => {
    return walletManager.getPublicClient()
  }, [walletManager])

  const getWalletClient = useCallback(() => {
    return walletManager.getWalletClient()
  }, [walletManager])

  // Clear error
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  // Initial state update
  useEffect(() => {
    if (!mounted) return
    updateState()
  }, [updateState, mounted])

  const value: WalletContextType = {
    // State
    isConnected,
    currentAccount,
    isLoading,
    error,
    availableWallets,
    capabilities,

    // Actions
    connectWallet,
    disconnectWallet,
    switchWallet,
    signMessage,
    sendTransaction,
    sign7702Authorization,
    submit7702Authorization,
    createSmartAccount,
    sendUserOperation,
    getAvailableKeys,
    getPublicClient,
    getWalletClient,
    clearError,

    // Utility
    walletManager
  }

  if (!mounted) {
    return <div>Loading...</div>
  }

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  )
}

export function useWalletManager() {
  const context = useContext(WalletContext)
  if (context === undefined) {
    throw new Error('useWalletManager must be used within a WalletProvider')
  }
  return context
}
