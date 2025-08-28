'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import { WalletManager } from '../lib/wallets/wallet-manager'
import { type WalletType, type WalletAccount, type WalletConfig } from '../types/wallet'
import { PageSkeleton } from '../components/ui/PageSkeleton'

interface WalletContextType {
  // State
  isConnected: boolean
  currentAccount: WalletAccount | null
  isLoading: boolean
  error: string | null
  availableWallets: WalletConfig[]
  capabilities: any
  currentDelegation: string | null
  currentNonce: number | null
  address: string | null
  publicClient: any
  walletClient: any
  isAutoConnecting: boolean
  isRenewingAccount: boolean

  // Actions
  connectWallet: (type: WalletType, keyIndex?: number) => Promise<WalletAccount>
  disconnectWallet: () => Promise<void>
  switchWallet: (type: WalletType, keyIndex?: number) => Promise<WalletAccount>
  autoConnectToKey0: () => Promise<WalletAccount | null>
  signMessage: (message: string) => Promise<string>
  signTypedData: (domain: any, types: any, message: any) => Promise<string>
  signPermit: (amount: bigint) => Promise<any>
  sendTransaction: (transaction: any) => Promise<string>
  sign7702Authorization: (authorizationData: any) => Promise<any>
  submit7702Authorization: (signedAuthorization: any) => Promise<any>
  createSmartAccount: () => Promise<string>
  sendUserOperation: (userOp: any) => Promise<string>
  getAvailableKeys: () => Promise<Array<{index: number, address: string}>>
  areLocalKeysAvailable: () => Promise<boolean>
  getAvailableInjectedAccounts: () => Promise<Array<{index: number, address: string}>>
  getAllAvailableAccounts: () => Promise<{
    localKeys: Array<{index: number, address: string}>,
    injectedAccounts: Array<{index: number, address: string}>
  }>
  getPublicClient: () => any
  getWalletClient: () => any
  clearError: () => void
  checkCurrentDelegation: () => Promise<void>
  filterCurrentDelegatee: (currentDelegations: string, options: any[]) => any[]
  isDelegateeSupported: (delegateeAddress: string) => boolean
  getDelegateeSupportInfo: (delegateeAddress: string) => { isSupported: boolean; reason?: string }
  getDelegateeOptionsWithReasons: (currentDelegations: string, options: any[]) => Array<any & { isSupported: boolean; reason?: string }>

  // Network detection
  getCurrentChainId: () => Promise<number | null>
  getCurrentNetwork: () => { chainId: number; name: string; isSupported: boolean } | null

  // Network switching
  switchNetwork: (chainId: number) => Promise<void>
  addNetwork: (chainId: number) => Promise<void>
  getSupportedNetworks: () => Array<{ chainId: number; name: string; isSupported: boolean; isDefault: boolean; chain: any }>
  getDefaultNetwork: () => { chainId: number; name: string; isSupported: boolean; isDefault: boolean; chain: any } | null
  setNetworkChangeCallback: (callback: (network: { chainId: number; name: string; isSupported: boolean }) => void) => void

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
  const [currentDelegation, setCurrentDelegation] = useState<string | null>(null)
  const [currentNonce, setCurrentNonce] = useState<number | null>(null)
  const [isAutoConnecting, setIsAutoConnecting] = useState(false)
  const [isRenewingAccount, setIsRenewingAccount] = useState(false)

  // Prevent hydration issues
  useEffect(() => {
    setMounted(true)
  }, [])

  // Load available wallets - memoized to prevent unnecessary re-runs
  const loadWallets = useCallback(async () => {
    if (!mounted) return

    try {
      const wallets = await walletManager.getAvailableWallets()
      setAvailableWallets(wallets)
    } catch (error) {
      console.error('Failed to load available wallets:', error)
    }
  }, [walletManager, mounted])

  // Load available wallets
  useEffect(() => {
    loadWallets()
  }, [loadWallets])

  // Auto-connect on first load
  useEffect(() => {
    if (!mounted) return

    const performAutoConnect = async () => {
      setIsAutoConnecting(true)
      try {
        const account = await walletManager.autoConnectToKey0()
        if (account) {
          // Update state directly to avoid dependency issues
          const currentAccount = walletManager.getCurrentAccount()
          const connected = walletManager.isConnected()
          setCurrentAccount(currentAccount)
          setIsConnected(connected)
        }
      } catch (error) {
        console.error('🔄 WalletContext: Auto-connect failed:', error)
      } finally {
        setIsAutoConnecting(false)
      }
    }

    performAutoConnect()
  }, [mounted, walletManager])

  // Update state from wallet manager
  const updateState = useCallback(async () => {
    const account = walletManager.getCurrentAccount()
    const connected = walletManager.isConnected()

    setCurrentAccount(account)
    setIsConnected(connected)

    // If wallet is connected, immediately check delegation synchronously
    if (connected && account) {
      try {
        await walletManager.checkCurrentDelegation()
        const delegation = walletManager.getCurrentDelegation()
        const nonce = await walletManager.getCurrentNonce()

        setCurrentDelegation(delegation)
        setCurrentNonce(nonce)
        setIsRenewingAccount(false)
      } catch (error) {
        console.error('❌ Context: Immediate delegation check failed:', error)
        setCurrentDelegation(null)
        setCurrentNonce(null)
        setIsRenewingAccount(false)
      }
    } else {
      setCurrentDelegation(null)
      setCurrentNonce(null)
      setIsRenewingAccount(false)
    }

    // Return a promise that resolves after state updates are fully processed
    return new Promise<void>((resolve) => {
      // Use multiple microtasks to ensure ALL state updates are processed
      queueMicrotask(() => {
        queueMicrotask(() => {
          queueMicrotask(() => {
            resolve();
          });
        });
      });
    });
  }, [walletManager, currentAccount, isConnected])

  // Auto-connect to KEY0
  const autoConnectToKey0 = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const account = await walletManager.autoConnectToKey0()
      await updateState()
      await checkCurrentDelegation();
      return account
    } catch (err) {
      console.error('❌ Context: autoConnectToKey0 error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to auto-connect'
      setError(errorMessage)
      throw err
    } finally {

      setIsLoading(false)
    }
  }, [walletManager, updateState])

  // Set up state change callback - memoized callback to prevent recreation
  const stateChangeCallback = useCallback(() => {
    updateState()
  }, [updateState])

  // Set up state change callback
  useEffect(() => {
    if (!mounted) return

    walletManager.setStateChangeCallback(stateChangeCallback)
  }, [walletManager, mounted, stateChangeCallback])

  // Connect to wallet
  const connectWallet = useCallback(async (type: WalletType, keyIndex?: number) => {
    setIsLoading(true)
    // Set renewal state when connecting to a specific account
    if (keyIndex !== undefined) {
      setIsRenewingAccount(true)
    }
    setError(null)

    try {
      const account = await walletManager.connectWallet(type, keyIndex)
      await updateState()
      return account
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect wallet'
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
      if (keyIndex !== undefined) {
        setIsRenewingAccount(false)
      }
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
      const account = await walletManager.switchWallet(type, keyIndex)
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

  const signTypedData = useCallback(async (domain: any, types: any, message: any) => {
    if (!isConnected) {
      throw new Error('No wallet connected')
    }

    setIsLoading(true)
    setError(null)

    try {
      return await walletManager.signTypedData(domain, types, message)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sign typed data'
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [walletManager, isConnected])

  const signPermit = useCallback(async (amount: bigint) => {
    if (!isConnected) {
      throw new Error('No wallet connected')
    }

    setIsLoading(true)
    setError(null)

    try {
      return await walletManager.signPermit(amount)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sign permit'
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

  // Get wallet capabilities - memoized to prevent recreation
  const capabilities = useMemo(() => walletManager.getCapabilities(), [walletManager])

  // Get available keys
  const getAvailableKeys = useCallback(async () => {
    return await walletManager.getAvailableKeys()
  }, [walletManager])

  // Check if local keys are available
  const areLocalKeysAvailable = useCallback(async () => {
    return await walletManager.areLocalKeysAvailable()
  }, [walletManager])

  // Get available injected accounts
  const getAvailableInjectedAccounts = useCallback(async () => {
    return await walletManager.getAvailableInjectedAccounts()
  }, [walletManager])

  // Get all available accounts
  const getAllAvailableAccounts = useCallback(async () => {
    return await walletManager.getAllAvailableAccounts()
  }, [walletManager])

  // EIP-7702 delegation status
  const checkCurrentDelegation = useCallback(async () => {
    try {
      await walletManager.checkCurrentDelegation()
      const delegation = walletManager.getCurrentDelegation()
      const nonce = await walletManager.getCurrentNonce()

      setCurrentDelegation(delegation)
      setCurrentNonce(nonce)
    } catch (error) {
      console.error('❌ Context: Failed to check current delegation:', error)
      setCurrentDelegation(null)
      setCurrentNonce(null)
      throw error; // Re-throw to trigger retry logic
    }
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

  // Memoized delegatee functions to prevent recreation
  const filterCurrentDelegatee = useCallback((currentDelegations: string, options: any[]) => {
    return walletManager.filterCurrentDelegatee(currentDelegations, options)
  }, [walletManager])

  const isDelegateeSupported = useCallback((delegateeAddress: string) => {
    return walletManager.isDelegateeSupported(delegateeAddress)
  }, [walletManager])

  const getDelegateeSupportInfo = useCallback((delegateeAddress: string) => {
    return walletManager.getDelegateeSupportInfo(delegateeAddress)
  }, [walletManager])

  const getDelegateeOptionsWithReasons = useCallback((currentDelegations: string, options: any[]) => {
    return walletManager.getDelegateeOptionsWithReasons(currentDelegations, options)
  }, [walletManager])

  // Memoized network functions
  const getCurrentChainId = useCallback(() => {
    return walletManager.getCurrentChainId()
  }, [walletManager])

  const getCurrentNetwork = useCallback(() => {
    return walletManager.getCurrentNetwork()
  }, [walletManager])

  const switchNetwork = useCallback((chainId: number) => {
    return walletManager.switchNetwork(chainId)
  }, [walletManager])

  const addNetwork = useCallback((chainId: number) => {
    return walletManager.addNetwork(chainId)
  }, [walletManager])

  const getSupportedNetworks = useCallback(() => {
    return walletManager.getSupportedNetworks()
  }, [walletManager])

  const getDefaultNetwork = useCallback(() => {
    return walletManager.getDefaultNetwork()
  }, [walletManager])

  const setNetworkChangeCallback = useCallback((callback: (network: { chainId: number; name: string; isSupported: boolean }) => void) => {
    return walletManager.setNetworkChangeCallback(callback)
  }, [walletManager])

  // Initial state update
  useEffect(() => {
    if (!mounted) return
    updateState()
  }, [updateState, mounted])

  // Check delegation when wallet connects or changes - memoized to prevent unnecessary re-runs
  const checkDelegationEffect = useCallback(() => {
    if (isConnected && currentAccount) {
      checkCurrentDelegation()
    } else {
      setCurrentDelegation(null)
      setCurrentNonce(null)
    }
  }, [isConnected, currentAccount, checkCurrentDelegation])

  // Check delegation when wallet connects or changes
  useEffect(() => {
    checkDelegationEffect()
  }, [checkDelegationEffect])






  // Memoized derived values to prevent unnecessary recalculations
  const address = useMemo(() => currentAccount?.address || null, [currentAccount?.address])
  const publicClient = useMemo(() => isConnected ? getPublicClient() : null, [isConnected, getPublicClient])
  const walletClient = useMemo(() => isConnected ? getWalletClient() : null, [isConnected, getWalletClient])

  // Memoized context value to prevent unnecessary re-renders
  const value = useMemo<WalletContextType>(() => ({
    // State
    isConnected,
    currentAccount,
    isLoading,
    error,
    availableWallets,
    capabilities,
    currentDelegation,
    currentNonce,
    address,
    publicClient,
    walletClient,
    isAutoConnecting,
    isRenewingAccount,

    // Actions
    connectWallet,
    disconnectWallet,
    switchWallet,
    autoConnectToKey0,
    signMessage,
    signTypedData,
    signPermit,
    sendTransaction,
    sign7702Authorization,
    submit7702Authorization,
    createSmartAccount,
    sendUserOperation,
    getAvailableKeys,
    areLocalKeysAvailable,
    getAvailableInjectedAccounts,
    getAllAvailableAccounts,
    getPublicClient,
    getWalletClient,
    clearError,
    checkCurrentDelegation,
    filterCurrentDelegatee,
    isDelegateeSupported,
    getDelegateeSupportInfo,
    getDelegateeOptionsWithReasons,

    // Network detection
    getCurrentChainId,
    getCurrentNetwork,

    // Network switching
    switchNetwork,
    addNetwork,
    getSupportedNetworks,
    getDefaultNetwork,
    setNetworkChangeCallback,

    // Utility
    walletManager
  }), [
    // State dependencies
    isConnected,
    currentAccount,
    isLoading,
    error,
    availableWallets,
    capabilities,
    currentDelegation,
    currentNonce,
    address,
    publicClient,
    walletClient,
    isAutoConnecting,

    // Action dependencies
    connectWallet,
    disconnectWallet,
    switchWallet,
    autoConnectToKey0,
    signMessage,
    signTypedData,
    signPermit,
    sendTransaction,
    sign7702Authorization,
    submit7702Authorization,
    createSmartAccount,
    sendUserOperation,
    getAvailableKeys,
    areLocalKeysAvailable,
    getAvailableInjectedAccounts,
    getAllAvailableAccounts,
    getPublicClient,
    getWalletClient,
    clearError,
    checkCurrentDelegation,
    filterCurrentDelegatee,
    isDelegateeSupported,
    getDelegateeSupportInfo,
    getDelegateeOptionsWithReasons,

    // Network dependencies
    getCurrentChainId,
    getCurrentNetwork,
    switchNetwork,
    addNetwork,
    getSupportedNetworks,
    getDefaultNetwork,
    setNetworkChangeCallback,

    // Utility dependencies
    walletManager
  ])

  if (!mounted) {
    return <PageSkeleton />
  }

  // Instead of blocking the entire page, pass loading states to children
  // This allows pages to show their skeleton structure while loading

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
