import { type Address, type Hex, type PublicClient, type WalletClient } from 'viem'

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

  // Transaction methods
  signMessage(message: string): Promise<Hex>
  signTypedData(domain: any, types: any, message: any): Promise<Hex>
  sendTransaction(transaction: unknown): Promise<Hex>

  // EIP-7702 specific methods
  sign7702Authorization(authorizationData: unknown): Promise<any> // Returns authorization + verification data
  submit7702Authorization(signedAuthorization: any): Promise<Hex>

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
