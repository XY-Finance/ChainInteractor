import { type Address, type Hex, type PublicClient, type WalletClient } from 'viem'
import { type DelegateeContract } from './index'

export type WalletType = 'local-key' | 'injected' | 'embedded'

export interface WalletConfig {
  type: WalletType
  name: string
  description: string
  isAvailable: boolean
}

export interface WalletAccount {
  address: Address
  type: WalletType
  isConnected: boolean
  keyIndex?: number // For env private key wallets
}

export interface WalletCapabilities {
  canSign: boolean
  canSendTransaction: boolean
  canSign7702Auth: boolean
  canCreateSmartAccount: boolean
}

export interface WalletInterface {
  // Core wallet methods
  connect(): Promise<WalletAccount>
  connectWithKey?(keyIndex: number): Promise<WalletAccount> // For env private key wallets
  disconnect(): Promise<void>
  getAccount(): Promise<WalletAccount | null>
  getCapabilities(): WalletCapabilities
  getAvailableKeys?(): Promise<LocalKeyInfo[]> // For local key wallets
  getWalletType(): WalletType

  // Network detection methods
  getCurrentChainId?(): Promise<number>
  getCurrentNetwork?(): { chainId: number; name: string; isSupported: boolean }

  // Network switching methods
  switchNetwork?(chainId: number): Promise<void>
  addNetwork?(chainId: number): Promise<void>
  getSupportedNetworks?(): Array<{ chainId: number; name: string; isSupported: boolean; isDefault: boolean; chain: any }>
  getDefaultNetwork?(): { chainId: number; name: string; isSupported: boolean; isDefault: boolean; chain: any }
  setNetworkChangeCallback?(callback: (network: { chainId: number; name: string; isSupported: boolean }) => void): void

  // Transaction methods
  signMessage(message: string): Promise<Hex>
  signTypedData(domain: any, types: any, message: any): Promise<Hex>
  sendTransaction(transaction: unknown): Promise<Hex>
  signPermit(amount: bigint): Promise<any>

  // EIP-7702 specific methods
  sign7702Authorization(authorizationData: unknown): Promise<any> // Returns authorization + verification data
  submit7702Authorization(signedAuthorization: any): Promise<Hex>
  filterCurrentDelegatee(currentDelegations: string, options: DelegateeContract[]): DelegateeContract[]
  isDelegateeSupported(delegateeAddress: string): boolean
  getDelegateeOptions(currentDelegations: string, options: DelegateeContract[]): Array<DelegateeContract & { isSupported: boolean }>
  getDelegateeSupportInfo(delegateeAddress: string): { isSupported: boolean; reason?: string }
  getDelegateeOptionsWithReasons(currentDelegations: string, options: DelegateeContract[]): Array<DelegateeContract & { isSupported: boolean; reason?: string }>

  // EIP-7702 delegation status methods
  checkCurrentDelegation?(): Promise<void>
  getCurrentDelegation?(): string | null
  getCurrentNonce?(): number | null

  // Smart account methods
  createSmartAccount(): Promise<Address>
  sendUserOperation(userOp: unknown): Promise<Hex>

  // Utility methods
  getPublicClient(): PublicClient
  getWalletClient(): WalletClient
}

export interface LocalKeyInfo {
  index: number
  address: Address
}

export interface LocalKeyConfig {
  privateKey: Hex
  chainId: number
}

export interface InjectedWalletConfig {
  connector: unknown // RainbowKit connector
  chainId: number
}

export interface EmbeddedWalletConfig {
  provider: unknown // Privy or similar provider
  chainId: number
}

export type WalletConfigMap = {
  'local-key': LocalKeyConfig
  'injected': InjectedWalletConfig
  'embedded': EmbeddedWalletConfig
}
