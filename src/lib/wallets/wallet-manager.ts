import { type WalletInterface, type WalletType, type WalletAccount, type WalletConfig } from '../../types/wallet'
import { LocalKeyWallet } from './local-key-wallet'

export class WalletManager {
  private wallets: Map<WalletType, WalletInterface> = new Map()
  private currentWallet: WalletInterface | null = null
  private currentAccount: WalletAccount | null = null

  constructor() {
    // Initialize wallets asynchronously
    this.initializeWallets().catch(console.error)
  }

    private async initializeWallets(): Promise<void> {
    console.log('🔧 Initializing wallets...')
    console.log('🔍 Checking if EnvPrivateKeyWallet is available...')

    // Initialize local key wallet
    const isLocalWalletAvailable = await LocalKeyWallet.isAvailable()
    if (isLocalWalletAvailable) {
      console.log('✅ LocalKeyWallet is available, creating instance...')
      const localWallet = new LocalKeyWallet()
      this.wallets.set('local-key', localWallet)
      console.log('✅ Local key wallet initialized')
    } else {
      console.log('❌ LocalKeyWallet is not available')
    }
  }

  // Get available wallet configurations
  async getAvailableWallets(): Promise<WalletConfig[]> {
    const configs: WalletConfig[] = []

    // Local key wallet
    const isLocalWalletAvailable = await LocalKeyWallet.isAvailable()
    configs.push({
      type: 'local-key',
      name: 'Local Private Key',
      description: 'Wallet using private key from environment variables',
      isAvailable: isLocalWalletAvailable
    })

    // TODO: Add injected wallet config when implemented
    configs.push({
      type: 'injected',
      name: 'Injected Wallet (MetaMask)',
      description: 'Browser wallet like MetaMask',
      isAvailable: false // Will be true when implemented
    })

    // TODO: Add embedded wallet config when implemented
    configs.push({
      type: 'embedded',
      name: 'Embedded Wallet (Privy)',
      description: 'Embedded wallet solution',
      isAvailable: false // Will be true when implemented
    })

    return configs
  }

    // Connect to a specific wallet type
  async connectWallet(type: WalletType, keyIndex?: number): Promise<WalletAccount> {
    const wallet = this.wallets.get(type)

    if (!wallet) {
      throw new Error(`Wallet type '${type}' is not available or not initialized`)
    }

    try {
      let account: WalletAccount

      if (type === 'local-key' && typeof keyIndex === 'number') {
        // Use the specific key index for environment private key wallets
        account = await (wallet as any).connectWithKey(keyIndex)
      } else {
        // Use default connection
        account = await wallet.connect()
      }

      this.currentWallet = wallet
      this.currentAccount = account

      console.log(`✅ Connected to ${type} wallet`)
      console.log(`📍 Address: ${account.address}`)
      if (account.keyIndex !== undefined) {
        console.log(`🔑 Key Index: ${account.keyIndex}`)
      }

      return account
    } catch (error) {
      console.error(`❌ Failed to connect to ${type} wallet:`, error)
      throw error
    }
  }

  // Disconnect current wallet
  async disconnectWallet(): Promise<void> {
    if (this.currentWallet) {
      await this.currentWallet.disconnect()
      this.currentWallet = null
      this.currentAccount = null
      console.log('🔌 Disconnected from wallet')
    }
  }

  // Get current wallet
  getCurrentWallet(): WalletInterface | null {
    return this.currentWallet
  }

  // Get current account
  getCurrentAccount(): WalletAccount | null {
    return this.currentAccount
  }

  // Check if wallet is connected
  isConnected(): boolean {
    return this.currentWallet !== null && this.currentAccount !== null
  }

  // Get wallet capabilities
  getCapabilities() {
    if (!this.currentWallet) {
      return null
    }
    return this.currentWallet.getCapabilities()
  }

    // Get available keys for local key wallet
  async getAvailableKeys() {
    const localWallet = this.wallets.get('local-key')
    if (localWallet && typeof (localWallet as any).getAvailableKeys === 'function') {
      const keys = await (localWallet as any).getAvailableKeys()
      // Convert to the format expected by WalletSelector
      return keys.map((key: any) => ({
        index: key.index,
        address: key.address
      }))
    }
    return []
  }

  // Convenience methods that delegate to current wallet
  async signMessage(message: string) {
    if (!this.currentWallet) {
      throw new Error('No wallet connected')
    }
    return await this.currentWallet.signMessage(message)
  }

  async signTypedData(domain: any, types: any, message: any) {
    if (!this.currentWallet) {
      throw new Error('No wallet connected')
    }
    return await this.currentWallet.signTypedData(domain, types, message)
  }

  async sendTransaction(transaction: any) {
    if (!this.currentWallet) {
      throw new Error('No wallet connected')
    }
    return await this.currentWallet.sendTransaction(transaction)
  }

  async sign7702Authorization(authorizationData: any) {
    if (!this.currentWallet) {
      throw new Error('No wallet connected')
    }
    return await this.currentWallet.sign7702Authorization(authorizationData)
  }

  async submit7702Authorization(signedAuthorization: any) {
    if (!this.currentWallet) {
      throw new Error('No wallet connected')
    }
    return await this.currentWallet.submit7702Authorization(signedAuthorization)
  }

  async createSmartAccount() {
    if (!this.currentWallet) {
      throw new Error('No wallet connected')
    }
    return await this.currentWallet.createSmartAccount()
  }

  async sendUserOperation(userOp: any) {
    if (!this.currentWallet) {
      throw new Error('No wallet connected')
    }
    return await this.currentWallet.sendUserOperation(userOp)
  }

  // Get public and wallet clients
  getPublicClient() {
    if (!this.currentWallet) {
      throw new Error('No wallet connected')
    }
    return this.currentWallet.getPublicClient()
  }

  getWalletClient() {
    if (!this.currentWallet) {
      throw new Error('No wallet connected')
    }
    return this.currentWallet.getWalletClient()
  }

  // Switch between available wallets
  async switchWallet(type: WalletType, keyIndex?: number): Promise<WalletAccount> {
    // Disconnect current wallet if connected
    if (this.currentWallet) {
      await this.disconnectWallet()
    }

    // Connect to new wallet with optional key index
    return await this.connectWallet(type, keyIndex)
  }

  // Get wallet status
  getStatus() {
    return {
      isConnected: this.isConnected(),
      currentWalletType: this.currentAccount?.type || null,
      currentAddress: this.currentAccount?.address || null,
      capabilities: this.getCapabilities(),
      availableWallets: this.getAvailableWallets()
    }
  }
}
