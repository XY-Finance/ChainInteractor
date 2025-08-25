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

    return await this.walletClient.signTypedData({
      account: account.address,
      domain,
      types,
      primaryType: types.EIP712Domain ? Object.keys(types).find(key => key !== 'EIP712Domain') : Object.keys(types)[0],
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
    // This is a placeholder - actual implementation depends on the specific wallet
    // For now, we'll just return a dummy transaction hash
    console.log('Submitting 7702 authorization:', signedAuthorization)
    return '0x0000000000000000000000000000000000000000000000000000000000000000' as Hex
  }

  // Smart account methods
  async createSmartAccount(): Promise<Address> {
    // This will be implemented by specific wallet types
    throw new Error('createSmartAccount not implemented for this wallet type')
  }

  async sendUserOperation(userOp: any): Promise<Hex> {
    // This will be implemented by specific wallet types
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
