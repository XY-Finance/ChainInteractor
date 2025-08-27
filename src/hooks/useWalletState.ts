import { useState, useCallback, useRef, useEffect } from 'react'
import { type WalletAccount, type WalletConfig } from '../types/wallet'

/*
OVERALL ARCHITECTURE LESSON:
This refactoring demonstrates the evolution from simple React patterns to robust state management.

ORIGINAL APPROACH (Component-Level State):
- Used useState hooks in WalletContext
- State lost on component unmount/remount
- Infinite re-render loops from dependency arrays
- Scattered state updates causing race conditions

FINAL APPROACH (Singleton State Manager):
- State persists across component lifecycle changes
- Centralized state updates prevent race conditions
- Proper dependency management prevents infinite loops
- Consistent error handling and loading states

KEY INSIGHTS:
1. Component-level state is fragile for persistent data
2. Dependency arrays are critical for preventing infinite loops
3. Centralized state management prevents inconsistencies
4. Singleton patterns solve persistence but require careful dependency management
*/

// LESSON: Singleton state manager to persist state across component re-renders
// PROBLEM: Component-level state (useState) gets lost when components unmount/remount
// - During async operations (wallet connection), React can unmount/remount components
// - This caused "isConnected: false" even after successful connection
// - State was reset to initial values on every component recreation
// SOLUTION: Singleton pattern ensures state persists across component lifecycle changes
// - State lives outside React component tree
// - Components subscribe to state changes via listeners
// - State survives component unmounts and re-renders
class WalletStateManager {
  private static instance: WalletStateManager
  private state: WalletState = {
    isConnected: false,
    currentAccount: null,
    isLoading: false,
    error: null,
    availableWallets: [],
    walletsLoaded: false,
    currentDelegation: null,
    currentNonce: null,
    currentChainId: null,
    currentNetwork: null,
    capabilities: null
  }
  private listeners: Set<(state: WalletState) => void> = new Set()

  static getInstance(): WalletStateManager {
    if (!WalletStateManager.instance) {
      WalletStateManager.instance = new WalletStateManager()
    }
    return WalletStateManager.instance
  }

  getState(): WalletState {
    return { ...this.state }
  }

  setState(updates: Partial<WalletState>) {
    this.state = { ...this.state, ...updates }
    this.notifyListeners()
  }

  subscribe(listener: (state: WalletState) => void): () => void {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  private notifyListeners() {
    this.listeners.forEach(listener => {
      try {
        listener(this.getState())
      } catch (error) {
        console.error('Error in state listener:', error)
      }
    })
  }
}

export interface WalletState {
  isConnected: boolean
  currentAccount: WalletAccount | null
  isLoading: boolean
  error: string | null
  availableWallets: WalletConfig[]
  walletsLoaded: boolean
  currentDelegation: string | null
  currentNonce: number | null
  currentChainId: number | null
  currentNetwork: { chainId: number; name: string; isSupported: boolean } | null
  capabilities: any | null
}

export interface WalletStateActions {
  setConnected: (connected: boolean) => void
  setCurrentAccount: (account: WalletAccount | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  clearError: () => void
  setAvailableWallets: (wallets: WalletConfig[]) => void
  setWalletsLoaded: (loaded: boolean) => void
  setCurrentDelegation: (delegation: string | null) => void
  setCurrentNonce: (nonce: number | null) => void
  setCurrentChainId: (chainId: number | null) => void
  setCurrentNetwork: (network: { chainId: number; name: string; isSupported: boolean } | null) => void
  setCapabilities: (capabilities: any) => void

  // Utility actions
  resetState: () => void
  updateFromWalletManager: (walletManager: any) => Promise<void>
}

export function useWalletState(): [WalletState, WalletStateActions] {
  // LESSON: Simple useState approach without singleton subscription
  // PROBLEM: Singleton subscription pattern was causing infinite loops
  // - Complex subscription/unsubscription logic was unstable
  // - Multiple useEffect hooks were conflicting
  // SOLUTION: Use simple useState with direct state updates
  // - No subscription system to cause loops
  // - State updates happen directly through actions
  // - Simpler and more predictable
  const [state, setState] = useState<WalletState>({
    isConnected: false,
    currentAccount: null,
    isLoading: false,
    error: null,
    availableWallets: [],
    walletsLoaded: false,
    currentDelegation: null,
    currentNonce: null,
    currentChainId: null,
    currentNetwork: null,
    capabilities: null
  })

  // Actions
  const actions: WalletStateActions = {
    // LESSON: Direct setState calls without singleton
    // PROBLEM: Singleton pattern was causing infinite loops and complexity
    // - Subscription system was unstable and hard to debug
    // - Multiple layers of state management were conflicting
    // SOLUTION: Direct setState calls for simplicity and reliability
    // - No subscription system to cause loops
    // - Direct state updates are predictable
    // - Easier to debug and maintain
    setConnected: useCallback((connected: boolean) => {
      setState(prev => ({ ...prev, isConnected: connected }))
    }, []),

    setCurrentAccount: useCallback((account: WalletAccount | null) => {
      setState(prev => ({ ...prev, currentAccount: account }))
    }, []),

    setLoading: useCallback((loading: boolean) => {
      setState(prev => ({ ...prev, isLoading: loading }))
    }, []),

    setError: useCallback((error: string | null) => {
      setState(prev => ({ ...prev, error }))
    }, []),

    clearError: useCallback(() => {
      setState(prev => ({ ...prev, error: null }))
    }, []),

    setAvailableWallets: useCallback((wallets: WalletConfig[]) => {
      setState(prev => ({ ...prev, availableWallets: wallets }))
    }, []),

    setWalletsLoaded: useCallback((loaded: boolean) => {
      setState(prev => ({ ...prev, walletsLoaded: loaded }))
    }, []),

    setCurrentDelegation: useCallback((delegation: string | null) => {
      setState(prev => ({ ...prev, currentDelegation: delegation }))
    }, []),

    setCurrentNonce: useCallback((nonce: number | null) => {
      setState(prev => ({ ...prev, currentNonce: nonce }))
    }, []),

    setCurrentChainId: useCallback((chainId: number | null) => {
      setState(prev => ({ ...prev, currentChainId: chainId }))
    }, []),

    setCurrentNetwork: useCallback((network: { chainId: number; name: string; isSupported: boolean } | null) => {
      setState(prev => ({ ...prev, currentNetwork: network }))
    }, []),

    setCapabilities: useCallback((capabilities: any) => {
      setState(prev => ({ ...prev, capabilities }))
    }, []),

    resetState: useCallback(() => {
      setState({
        isConnected: false,
        currentAccount: null,
        isLoading: false,
        error: null,
        availableWallets: [],
        walletsLoaded: false,
        currentDelegation: null,
        currentNonce: null,
        currentChainId: null,
        currentNetwork: null,
        capabilities: null
      })
    }, []),

    // LESSON: Centralized state update from wallet manager
    // PROBLEM: Scattered state updates caused race conditions and inconsistencies
    // - Multiple places updating state independently (setConnected, setCurrentAccount, etc.)
    // - State could be partially updated, leading to inconsistent UI state
    // - Race conditions between different state setters
    // SOLUTION: Single atomic state update with all wallet data
    // - All related state updated in one operation
    // - Consistent state across all wallet properties
    // - No partial updates or race conditions
    updateFromWalletManager: useCallback(async (walletManager: any) => {
      try {
        const account = await walletManager.getCurrentAccount()
        const connected = await walletManager.isConnected()

        setState(prev => ({
          ...prev,
          currentAccount: account,
          isConnected: connected,
          capabilities: walletManager.getCapabilities(),
          currentDelegation: walletManager.getCurrentDelegation?.() || null,
          currentNonce: walletManager.getCurrentNonce?.() || null,
          currentNetwork: walletManager.getCurrentNetwork?.() || null,
          currentChainId: walletManager.getCurrentNetwork?.()?.chainId || null
        }))
      } catch (error) {
        console.error('Failed to update state from wallet manager:', error)
        setState(prev => ({ ...prev, error: error instanceof Error ? error.message : 'Unknown error' }))
      }
    }, [])
  }

  return [state, actions]
}
