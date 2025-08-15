import { type Address } from 'viem'
import { type Implementation } from '@metamask/delegation-toolkit'

// EIP-7702 related types
export interface DelegateeContract {
  name: string
  address: Address
  description: string
  implementation: Implementation
}

export interface AuthorizationData {
  address: `0x${string}`
  chainId: number
  nonce: number
  contractAddress: `0x${string}`
  executor: 'self'
}

export interface SignedAuthorization extends AuthorizationData {
  signature: `0x${string}`
}

// UI State types
export interface LogEntry {
  timestamp: string
  message: string
  type?: 'info' | 'success' | 'error' | 'warning'
}

// Network configuration types
export interface NetworkConfig {
  chain: unknown
  bundlerUrl: string
  rpcUrl: string
}

// Feature configuration types
export interface FeatureConfig {
  enabled: boolean
  settings: Record<string, unknown>
}
