import {
  type Address,
  type Hex,
  createWalletClient,
  http
} from 'viem'

import { sepolia } from 'viem/chains'
import { BaseWallet } from './base-wallet'
import {
  type WalletAccount,
  type WalletCapabilities,
  type WalletType,
  type LocalKeyInfo
} from '../../types/wallet'

export class LocalKeyWallet extends BaseWallet {
  private privateKey: Hex | null = null
  private keyIndex: number = 0
  private availableKeys: LocalKeyInfo[] = []

  constructor(chainId: number = sepolia.id) {
    super(chainId)
    // Initialize keys asynchronously
    this.loadAvailableKeys().catch(console.error)
  }

        private async loadAvailableKeys(): Promise<void> {
    try {
      // Check availability via API
      const response = await fetch('/api/wallet-status')
      const data = await response.json()

      if (!data.localKeyAvailable) {
        this.availableKeys = []
        return
      }

      // Get addresses only (no private keys) from the server
      const keysResponse = await fetch('/api/local-addresses')
      const keysData = await keysResponse.json()

      if (keysData.keys && keysData.keys.length > 0) {
        this.availableKeys = keysData.keys.map((keyInfo: any) => ({
          index: keyInfo.index,
          address: keyInfo.address
        }))
      } else {
        this.availableKeys = []
      }
    } catch (error) {
      console.error('❌ Failed to load available keys:', error)
      this.availableKeys = []
    }
  }



  async getAvailableKeys(): Promise<LocalKeyInfo[]> {
    return this.availableKeys
  }

  // Override signMessage to use server API (private keys stay on server)
  async signMessage(message: string): Promise<Hex> {
    const account = await this.getAccount()
    if (!account) {
      throw new Error('No account connected')
    }

    // Use server API for signing (private keys stay on server)
    const response = await fetch('/api/wallet-operations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        operation: 'signMessage',
        keyIndex: account.keyIndex,
        message
      })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to sign message')
    }

    const data = await response.json()
    return data.signature
  }

  async connect(): Promise<WalletAccount> {
    if (this.availableKeys.length === 0) {
      throw new Error('Environment private key wallet is unavailable. No valid private keys found in PRIVATE_KEYS environment variable.')
    }

    // Connect with the first available key by default
    return this.connectWithKey(0)
  }

  async connectWithKey(keyIndex: number): Promise<WalletAccount> {
    if (this.availableKeys.length === 0) {
      throw new Error('No available keys loaded. Please wait for wallet initialization to complete.')
    }

    if (keyIndex < 0 || keyIndex >= this.availableKeys.length) {
      throw new Error(`Invalid key index ${keyIndex}. Available keys: 0-${this.availableKeys.length - 1}`)
    }

    const keyInfo = this.availableKeys[keyIndex]
    this.keyIndex = keyIndex

    // Use the address from the API (private keys stay on server)
    const address = keyInfo.address

    // Create a dummy wallet client for compatibility (actual operations go through server API)
    const dummyAccount = { address } as any
    const walletClient = createWalletClient({
      account: dummyAccount,
      chain: sepolia,
      transport: http()
    })

    this.setWalletClient(walletClient)

    // Create wallet account with key index
    const walletAccount = this.createAccount(address, 'local-key')
    walletAccount.keyIndex = keyIndex
    this.setAccount(walletAccount)



    return walletAccount
  }

  async disconnect(): Promise<void> {
    this.account = null
    this.privateKey = null

  }

  async getAccount(): Promise<WalletAccount | null> {
    return this.account
  }

  getCapabilities(): WalletCapabilities {
    return {
      canSign: true,
      canSendTransaction: true,
      canSign7702Auth: true,
      canCreateSmartAccount: true
    }
  }

  getWalletType(): WalletType {
    return 'local-key'
  }

    // Override EIP-7702 methods for better implementation
  async sign7702Authorization(authorizationData: any): Promise<Hex> {
    const account = await this.getAccount()
    if (!account) {
      throw new Error('No account connected')
    }

    // Use server API for signing (private keys stay on server)
    const message = JSON.stringify(authorizationData)
    const response = await fetch('/api/wallet-operations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        operation: 'signMessage',
        keyIndex: account.keyIndex,
        message
      })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to sign 7702 authorization')
    }

    const data = await response.json()
    return data.signature
  }

  async submit7702Authorization(signedAuthorization: Hex): Promise<Hex> {
    if (!this.walletClient) {
      throw new Error('Wallet not connected')
    }

    const account = await this.getAccount()
    if (!account) {
      throw new Error('No account connected')
    }

    // For environment private key wallets, we can submit the authorization
    // This is a simplified implementation - in practice, you'd need to
    // interact with the specific EIP-7702 contract
    console.log('📤 Submitting 7702 authorization with environment private key wallet')
    console.log('🔑 Account:', account.address)
    console.log('📝 Signed Authorization:', signedAuthorization)

    // For now, return a dummy transaction hash
    // In a real implementation, you'd send a transaction to the EIP-7702 contract
    return '0x0000000000000000000000000000000000000000000000000000000000000000' as Hex
  }

  // Override smart account methods
  async createSmartAccount(): Promise<Address> {
    if (!this.walletClient) {
      throw new Error('Wallet not connected')
    }

    const account = await this.getAccount()
    if (!account) {
      throw new Error('No account connected')
    }

    console.log('🏗️ Creating smart account with environment private key wallet')
    console.log('🔑 EOA Address:', account.address)

    // This would integrate with ZeroDev or similar smart account provider
    // For now, return the EOA address as a placeholder
    return account.address
  }

  async sendUserOperation(userOp: any): Promise<Hex> {
    if (!this.walletClient) {
      throw new Error('Wallet not connected')
    }

    const account = await this.getAccount()
    if (!account) {
      throw new Error('No account connected')
    }

    console.log('📤 Sending user operation with environment private key wallet')
    console.log('🔑 Account:', account.address)
    console.log('📝 User Operation:', userOp)

    // This would integrate with a bundler service
    // For now, return a dummy transaction hash
    return '0x0000000000000000000000000000000000000000000000000000000000000000' as Hex
  }

  // Helper method to check if wallet is available
  static async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch('/api/wallet-status')
      const data = await response.json()
      return data.localKeyAvailable
    } catch (error) {
      console.error('❌ Failed to check wallet availability:', error)
      return false
    }
  }

  // Helper method to get wallet info
  static getWalletInfo() {
    return {
      type: 'local-key' as WalletType,
      name: 'Local Private Key',
      description: 'Wallet using private key from environment variables',
      isAvailable: this.isAvailable()
    }
  }
}
