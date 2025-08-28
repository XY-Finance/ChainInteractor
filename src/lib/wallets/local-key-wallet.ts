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
import { addresses } from '../../config/addresses'

export class LocalKeyWallet extends BaseWallet {
  private privateKey: Hex | null = null
  private keyIndex: number = 0
  private availableKeys: LocalKeyInfo[] = []
  private keysLoaded = false
  private keysLoadingPromise: Promise<void> | null = null

  constructor(chainId: number = sepolia.id) {
    super(chainId)
    // Initialize keys asynchronously
    this.keysLoadingPromise = this.loadAvailableKeys()
  }

  private async loadAvailableKeys(): Promise<void> {
    if (this.keysLoaded) {
      return
    }

    try {
      // Check availability via API
      const response = await fetch('/api/wallet-status')
      const data = await response.json()

      if (!data.localKeyAvailable) {
        this.availableKeys = []
        this.keysLoaded = true
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

      this.keysLoaded = true
    } catch (error) {
      console.error('❌ Failed to load available keys:', error)
      this.availableKeys = []
      this.keysLoaded = true
    }
  }

  async getAvailableKeys(): Promise<LocalKeyInfo[]> {
    // Wait for keys to be loaded if they're still loading
    if (this.keysLoadingPromise) {
      await this.keysLoadingPromise
    }
    return this.availableKeys
  }

  // Check if keys are loaded
  async areKeysLoaded(): Promise<boolean> {
    // Wait for keys to be loaded if they're still loading
    if (this.keysLoadingPromise) {
      await this.keysLoadingPromise
    }
    return this.keysLoaded && this.availableKeys.length > 0
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

  // Override signTypedData to use server API (private keys stay on server)
  async signTypedData(domain: any, types: any, message: any): Promise<Hex> {
    const account = await this.getAccount()
    if (!account) {
      throw new Error('No account connected')
    }

    // Use server API for signing typed data (private keys stay on server)
    const response = await fetch('/api/wallet-operations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        operation: 'signTypedData',
        keyIndex: account.keyIndex,
        message: {
          domain,
          types,
          primaryType: types.Permit ? 'Permit' : 'Message',
          message
        }
      })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to sign typed data')
    }

    const data = await response.json()
    return data.signature
  }

  // Override signPermit to use server API
  async signPermit(amount: bigint): Promise<any> {
    const account = await this.getAccount()
    if (!account) {
      throw new Error('No account connected')
    }

    // Use server API to sign permit
    const response = await fetch('/api/wallet-operations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        operation: 'signPermit',
        keyIndex: account.keyIndex,
        amount: amount.toString()
      })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to sign permit')
    }

    const data = await response.json()
    return data.permit
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
  async sign7702Authorization(authorizationData: any): Promise<any> {
    const account = await this.getAccount()
    if (!account) {
      throw new Error('No account connected')
    }

    // Use server API for EIP-7702 authorization (private keys stay on server)
    const response = await fetch('/api/wallet-operations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        operation: 'sign7702Authorization',
        keyIndex: account.keyIndex,
        message: JSON.stringify(authorizationData)
      })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to create EIP-7702 authorization')
    }

    const data = await response.json()
    const authorization = data.authorization
    const verification = data.verification

    // Return both authorization and verification data
    return {
      authorization,
      verification
    }
  }

  async submit7702Authorization(signedAuthorization: any): Promise<Hex> {
    const account = await this.getAccount()
    if (!account) {
      throw new Error('No account connected')
    }

    // Use server API to submit EIP-7702 authorization
    const response = await fetch('/api/wallet-operations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        operation: 'submit7702Authorization',
        keyIndex: account.keyIndex,
        message: signedAuthorization
      })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to submit EIP-7702 authorization')
    }

    const data = await response.json()
    return data.hash
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

  // EIP-7702 delegation status methods
  private currentDelegation: string | null = null
  private currentNonce: number | null = null

    async checkCurrentDelegation(): Promise<void> {
    const account = await this.getAccount()
    if (!account) {
      this.currentDelegation = null;
      this.currentNonce = null;
      return;
    }

    try {
      // Check if the account has any code (indicating it might be a smart account)
      const code = await this.publicClient.getCode({
        address: account.address,
        blockTag: 'latest'
      });

      // For EIP-7702, we need to check if the account has been delegated
      // This is a simplified check - in a real implementation, you'd query the delegation contract
      if (code === '0x') {
        // Regular EOA - not delegated
        this.currentDelegation = null;
      } else {
        // Check if this is EIP-7702 delegation bytecode
        // EIP-7702 delegation starts with 0xef0100 followed by the delegatee address
        if (code.startsWith('0xef0100')) {
          // Extract the delegatee address (20 bytes = 40 hex chars after 0xef0100)
          const delegateeAddress = '0x' + code.slice(8, 48); // 0xef0100 = 8 chars, + 40 chars for address

          // Check if this delegatee is in our known list
          const knownDelegatees = Object.values(addresses.delegatee);
          const isKnownDelegatee = knownDelegatees.some(addr =>
            addr.toLowerCase() === delegateeAddress.toLowerCase()
          );

          if (isKnownDelegatee) {
            this.currentDelegation = delegateeAddress;
          } else {
            this.currentDelegation = delegateeAddress;
          }
        } else {
          // Account has code but not EIP-7702 delegation format
          this.currentDelegation = null;
        }
      }

      // Get current nonce using publicClient
      const nonce = await this.publicClient.getTransactionCount({
        address: account.address,
        blockTag: 'latest'
      });

      this.currentNonce = Number(nonce);

    } catch (error) {
      console.error('❌ LocalKeyWallet: Failed to check current delegation:', error);
      // Set to not delegated on error
      this.currentDelegation = null;
      this.currentNonce = null;
    }
  }

  getCurrentDelegation(): string | null {
    return this.currentDelegation;
  }

  async getCurrentNonce(): Promise<number | null> {
    try {
      const account = await this.getAccount()
      if (!account) {
        return null
      }

      // Use server API to get nonce
      const response = await fetch('/api/wallet-status')
      if (!response.ok) {
        console.error('Failed to fetch wallet status for nonce')
        return null
      }

      const data = await response.json()
      return data.nonce || null
    } catch (error) {
      console.error('Failed to get nonce for local key wallet:', error)
      return null
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
