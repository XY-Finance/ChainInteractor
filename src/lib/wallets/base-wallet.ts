import {
  type Address,
  type Hex,
  type PublicClient,
  type WalletClient,
  createPublicClient,
  createWalletClient,
  http
} from 'viem'
import { sepolia } from 'viem/chains'
import {
  type WalletAccount,
  type WalletCapabilities,
  type WalletInterface,
  type WalletType
} from '../../types/wallet'
import { type DelegateeContract } from '../../types'

export abstract class BaseWallet implements WalletInterface {
  protected publicClient: PublicClient
  protected walletClient!: WalletClient
  protected account: WalletAccount | null = null
  protected chainId: number

  constructor(chainId: number = sepolia.id) {
    this.chainId = chainId
    this.publicClient = createPublicClient({
      chain: sepolia,
      transport: http()
    })
  }

  // Abstract methods that must be implemented by subclasses
  abstract connect(): Promise<WalletAccount>
  abstract disconnect(): Promise<void>
  abstract getAccount(): Promise<WalletAccount | null>
  abstract getCapabilities(): WalletCapabilities
  abstract getWalletType(): WalletType

  // Optional method for key selection (only for env private key wallets)
  connectWithKey?(_keyIndex: number): Promise<WalletAccount>

  // Common transaction methods
  async signMessage(message: string): Promise<Hex> {
    if (!this.walletClient) {
      throw new Error('Wallet client not initialized')
    }

    const account = await this.getAccount()
    if (!account) {
      throw new Error('No account connected')
    }

    return await this.walletClient.signMessage({
      account: account.address,
      message
    })
  }

  async signTypedData(domain: any, types: any, message: any): Promise<Hex> {
    if (!this.walletClient) {
      throw new Error('Wallet client not initialized')
    }

    const account = await this.getAccount()
    if (!account) {
      throw new Error('No account connected')
    }

    const primaryType = types.EIP712Domain ? Object.keys(types).find(key => key !== 'EIP712Domain') : Object.keys(types)[0]
    if (!primaryType) {
      throw new Error('No valid primary type found in types')
    }

    return await this.walletClient.signTypedData({
      account: account.address,
      domain,
      types,
      primaryType,
      message
    })
  }

  async sendTransaction(transaction: unknown): Promise<Hex> {
    if (!this.walletClient) {
      throw new Error('Wallet client not initialized')
    }

    const account = await this.getAccount()
    if (!account) {
      throw new Error('No account connected')
    }

    return await this.walletClient.sendTransaction({
      ...(transaction as Record<string, unknown>),
      account: account.address,
      chain: this.publicClient.chain
    })
  }

  async signPermit(amount: bigint): Promise<any> {
    // This method must be implemented by specific wallet types
    throw new Error('signPermit not implemented for this wallet type')
  }

  // EIP-7702 specific methods
  async sign7702Authorization(authorizationData: any): Promise<Hex> {
    if (!this.walletClient) {
      throw new Error('Wallet client not initialized')
    }

    const account = await this.getAccount()
    if (!account) {
      throw new Error('No account connected')
    }

    // For now, we'll use personal_sign as a fallback
    // This will be overridden by specific wallet implementations
    const message = JSON.stringify(authorizationData)
    return await this.walletClient.request({
      method: 'personal_sign',
      params: [account.address, `0x${Buffer.from(message, 'utf8').toString('hex')}`]
    }) as Hex
  }

  async submit7702Authorization(signedAuthorization: Hex): Promise<Hex> {
    // This method must be implemented by specific wallet types
    throw new Error('submit7702Authorization not implemented for this wallet type')
  }

  // Delegatee filtering method
  filterCurrentDelegatee(currentDelegations: string, options: DelegateeContract[]): DelegateeContract[] {
    return options.filter(contract => contract.address.toLowerCase() !== currentDelegations.toLowerCase())
  }

  // Check if a specific delegatee is supported by this wallet
  isDelegateeSupported(delegateeAddress: string): boolean {
    // Base implementation - all delegatees are supported
    // Override in specific wallet implementations (e.g., MetaMask)
    return true
  }



  // Get detailed support information for a delegatee
  getDelegateeSupportInfo(delegateeAddress: string): { isSupported: boolean; reason?: string } {
    const isSupported = this.isDelegateeSupported(delegateeAddress)
    return {
      isSupported,
      reason: isSupported ? undefined : 'This wallet type does not support this delegatee'
    }
  }

  // Get delegatee options with detailed support information
  getDelegateeOptionsWithReasons(currentDelegations: string, options: DelegateeContract[]): Array<DelegateeContract & { isSupported: boolean; reason?: string }> {
    const availableOptions = this.filterCurrentDelegatee(currentDelegations, options)
    return availableOptions.map(contract => ({
      ...contract,
      ...this.getDelegateeSupportInfo(contract.address)
    }))
  }

  // EIP-7702 delegation status methods
  async checkCurrentDelegation(): Promise<void> {
    // Base implementation - no delegation checking
    // Override in specific wallet implementations
  }

  getCurrentDelegation(): string | null {
    // Base implementation - no delegation
    return null
  }

  getCurrentNonce(): number | null {
    // Base implementation - no nonce tracking
    return null
  }

  // Smart account methods
  async createSmartAccount(): Promise<Address> {
    // This method must be implemented by specific wallet types
    throw new Error('createSmartAccount not implemented for this wallet type')
  }

  async sendUserOperation(userOp: any): Promise<Hex> {
    // This method must be implemented by specific wallet types
    throw new Error('sendUserOperation not implemented for this wallet type')
  }

  // Utility methods
  getPublicClient(): PublicClient {
    return this.publicClient
  }

  getWalletClient(): WalletClient {
    if (!this.walletClient) {
      throw new Error('Wallet client not initialized')
    }
    return this.walletClient
  }

  // Helper methods
  protected setWalletClient(walletClient: WalletClient): void {
    this.walletClient = walletClient
  }

  protected setAccount(account: WalletAccount | null): void {
    this.account = account
  }

  protected createAccount(address: Address, type: WalletType): WalletAccount {
    return {
      address,
      type,
      isConnected: true
    }
  }
}
