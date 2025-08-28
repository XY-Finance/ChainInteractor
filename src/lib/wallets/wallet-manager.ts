import { type WalletInterface, type WalletType, type WalletAccount, type WalletConfig, type WalletCapabilities } from '../../types/wallet'
import { LocalKeyWallet } from './local-key-wallet'
import { InjectedWallet } from './injected-wallet'
import { type DelegateeContract } from '../../types'
import { sepolia } from 'viem/chains'

export class WalletManager {
  private wallets: Map<WalletType, WalletInterface> = new Map()
  private currentWallet: WalletInterface | null = null
  private currentAccount: WalletAccount | null = null
  private stateChangeCallback?: () => void
  private isInitialized = false
  private initializationPromise: Promise<void> | null = null

  constructor() {
    // Initialize wallets asynchronously
    this.initializationPromise = this.initializeWallets()
  }

  // Set callback for state changes
  setStateChangeCallback(callback: () => void) {
    this.stateChangeCallback = callback
  }

  // Notify React context of state changes
  private notifyStateChange(): void {
    if (this.stateChangeCallback) {
      this.stateChangeCallback()
    }
  }

  // Wait for initialization to complete
  async waitForInitialization(): Promise<void> {
    if (this.initializationPromise) {
      await this.initializationPromise
    }
  }

  private async initializeWallets(): Promise<void> {
    console.log('🔧 WalletManager: Initializing wallets...')

    // Initialize local key wallet
    const isLocalWalletAvailable = await LocalKeyWallet.isAvailable()
    console.log('🔧 WalletManager: Local wallet available:', isLocalWalletAvailable)
    if (isLocalWalletAvailable) {
      const localWallet = new LocalKeyWallet()
      this.wallets.set('local-key', localWallet)
      console.log('🔧 WalletManager: Local wallet initialized')

      // Wait for local keys to be loaded
      console.log('🔧 WalletManager: Waiting for local keys to load...')
      await localWallet.areKeysLoaded()
      console.log('🔧 WalletManager: Local keys loaded')
    }

    // Initialize injected wallet (MetaMask)
    const isInjectedWalletAvailable = await InjectedWallet.isAvailable()
    console.log('🔧 WalletManager: Injected wallet available:', isInjectedWalletAvailable)
    if (isInjectedWalletAvailable) {
      const injectedWallet = new InjectedWallet()
      this.wallets.set('injected', injectedWallet)
      console.log('🔧 WalletManager: Injected wallet initialized')
    }

    this.isInitialized = true
    console.log('🔧 WalletManager: Wallet initialization complete. Wallets:', Array.from(this.wallets.keys()))
  }

  // Get available wallet configurations
  async getAvailableWallets(): Promise<WalletConfig[]> {
    await this.waitForInitialization()

    const configs: WalletConfig[] = []

    // Local key wallet
    const isLocalWalletAvailable = await LocalKeyWallet.isAvailable()
    configs.push({
      type: 'local-key',
      name: 'Local Private Key',
      description: 'Wallet using private key from environment variables',
      isAvailable: isLocalWalletAvailable
    })

    // Injected wallet (MetaMask)
    const isInjectedWalletAvailable = await InjectedWallet.isAvailable()
    configs.push({
      type: 'injected',
      name: 'Injected Wallet (MetaMask)',
      description: 'Browser wallet like MetaMask',
      isAvailable: isInjectedWalletAvailable
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

  // Auto-connect to KEY0 on first login
  async autoConnectToKey0(): Promise<WalletAccount | null> {
    await this.waitForInitialization()

    // Check if we're already connected
    if (this.isConnected()) {
      return this.currentAccount
    }

    // Try to connect to local-key KEY0 first
    const localWallet = this.wallets.get('local-key')
    if (localWallet) {
      try {
        console.log('🔧 WalletManager: Attempting auto-connect to KEY0...')
        const account = await this.connectWallet('local-key', 0)
        console.log('🔧 WalletManager: Auto-connected to KEY0:', account.address)
        return account
      } catch (error) {
        console.log('🔧 WalletManager: Failed to auto-connect to KEY0:', error)
        // Continue to try other wallets if local-key fails
      }
    }

    // If local-key fails, try injected wallet
    const injectedWallet = this.wallets.get('injected')
    if (injectedWallet) {
      try {
        console.log('🔧 WalletManager: Attempting auto-connect to injected wallet...')
        const account = await this.connectWallet('injected')
        console.log('🔧 WalletManager: Auto-connected to injected wallet:', account.address)
        return account
      } catch (error) {
        console.log('🔧 WalletManager: Failed to auto-connect to injected wallet:', error)
      }
    }

    console.log('🔧 WalletManager: No auto-connect successful')
    return null
  }

  // Connect to a specific wallet type
  async connectWallet(type: WalletType, keyIndex?: number): Promise<WalletAccount> {
    await this.waitForInitialization()

    const wallet = this.wallets.get(type)

    if (!wallet) {
      throw new Error(`Wallet type '${type}' is not available or not initialized`)
    }

    try {
      let account: WalletAccount

      if (type === 'local-key' && typeof keyIndex === 'number') {
        // Use the specific key index for environment private key wallets
        account = await (wallet as any).connectWithKey(keyIndex)
      } else if (type === 'injected' && typeof keyIndex === 'number') {
        // Use the specific account index for injected wallets
        account = await (wallet as any).connect(keyIndex)
      } else {
        // Use default connection
        account = await wallet.connect()
      }

      // Set up account change callback for injected wallets
      if (type === 'injected' && (wallet as any).setAccountChangeCallback) {
        ;(wallet as any).setAccountChangeCallback((newAccount: WalletAccount | null) => {
          this.currentAccount = newAccount
          if (!newAccount) {
            this.currentWallet = null
          } else {
          }

          // Notify React context of state change
          this.notifyStateChange()
        })
      }

      this.currentWallet = wallet
      this.currentAccount = account

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
      // Notify React context of state change
      this.notifyStateChange()
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

  // Helper method to check if current wallet supports a specific operation
  supportsOperation(operation: keyof WalletCapabilities): boolean {
    if (!this.currentWallet) {
      return false
    }
    const capabilities = this.currentWallet.getCapabilities()
    return capabilities[operation] || false
  }

  // Get available keys for local key wallet - now returns a promise
  async getAvailableKeys() {
    await this.waitForInitialization()

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

  // Check if local keys are loaded and available
  async areLocalKeysAvailable(): Promise<boolean> {
    await this.waitForInitialization()

    const localWallet = this.wallets.get('local-key')
    if (localWallet && typeof (localWallet as any).areKeysLoaded === 'function') {
      return await (localWallet as any).areKeysLoaded()
    }
    return false
  }

  // Get available accounts for injected wallet (MetaMask) - now returns a promise
  async getAvailableInjectedAccounts() {
    await this.waitForInitialization()

    console.log('🔍 WalletManager: Getting available injected accounts...')

    const injectedWallet = this.wallets.get('injected')
    console.log('🔍 WalletManager: Injected wallet found:', !!injectedWallet)

    if (injectedWallet && typeof (injectedWallet as any).getAvailableAccounts === 'function') {
      try {
        console.log('🔍 WalletManager: Calling getAvailableAccounts on injected wallet...')
        const accounts = await (injectedWallet as any).getAvailableAccounts()
        console.log('🔍 WalletManager: Raw accounts from injected wallet:', accounts)

        // Convert to the format expected by WalletSelector
        const formattedAccounts = accounts.map((account: any, index: number) => ({
          index: index,
          address: account.address
        }))

        console.log('🔍 WalletManager: Formatted accounts:', formattedAccounts)
        return formattedAccounts
      } catch (error) {
        console.error('❌ WalletManager: Error getting injected accounts:', error)
        return []
      }
    }

    console.log('❌ WalletManager: No injected wallet or getAvailableAccounts method not found')
    return []
  }

  // Get all available accounts from all wallet types
  async getAllAvailableAccounts(): Promise<{
    localKeys: Array<{index: number, address: string}>,
    injectedAccounts: Array<{index: number, address: string}>
  }> {
    await this.waitForInitialization()

    const [localKeys, injectedAccounts] = await Promise.all([
      this.getAvailableKeys(),
      this.getAvailableInjectedAccounts()
    ])

    return {
      localKeys,
      injectedAccounts
    }
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

  async signPermit(amount: bigint) {
    if (!this.currentWallet) {
      throw new Error('No wallet connected')
    }
    return await this.currentWallet.signPermit(amount)
  }



  async sign7702Authorization(authorizationData: any) {
    if (!this.currentWallet) {
      throw new Error('No wallet connected')
    }

    if (typeof this.currentWallet.sign7702Authorization !== 'function') {
      throw new Error(`Current wallet type '${this.currentWallet.getWalletType()}' does not support EIP-7702 authorization signing`)
    }

    return await this.currentWallet.sign7702Authorization(authorizationData)
  }

  async submit7702Authorization(signedAuthorization: any) {
    if (!this.currentWallet) {
      throw new Error('No wallet connected')
    }

    if (typeof this.currentWallet.submit7702Authorization !== 'function') {
      throw new Error(`Current wallet type '${this.currentWallet.getWalletType()}' does not support EIP-7702 authorization submission`)
    }

    return await this.currentWallet.submit7702Authorization(signedAuthorization)
  }

  filterCurrentDelegatee(currentDelegations: string, options: DelegateeContract[]): DelegateeContract[] {
    if (!this.currentWallet) {
      throw new Error('No wallet connected')
    }

    if (typeof this.currentWallet.filterCurrentDelegatee !== 'function') {
      throw new Error(`Current wallet type '${this.currentWallet.getWalletType()}' does not support delegatee filtering`)
    }

    return this.currentWallet.filterCurrentDelegatee(currentDelegations, options)
  }

  isDelegateeSupported(delegateeAddress: string): boolean {
    if (!this.currentWallet) {
      return false
    }

    if (typeof this.currentWallet.isDelegateeSupported !== 'function') {
      return true // Default to supported if method doesn't exist
    }

    return this.currentWallet.isDelegateeSupported(delegateeAddress)
  }



  getDelegateeSupportInfo(delegateeAddress: string): { isSupported: boolean; reason?: string } {
    if (!this.currentWallet) {
      return { isSupported: false, reason: 'No wallet connected' }
    }

    return this.currentWallet.getDelegateeSupportInfo(delegateeAddress)
  }

  getDelegateeOptionsWithReasons(currentDelegations: string, options: DelegateeContract[]): Array<DelegateeContract & { isSupported: boolean; reason?: string }> {
    if (!this.currentWallet) {
      throw new Error('No wallet connected')
    }

    if (typeof this.currentWallet.getDelegateeOptionsWithReasons !== 'function') {
      throw new Error(`Current wallet type '${this.currentWallet.getWalletType()}' does not support delegatee options with reasons`)
    }

    return this.currentWallet.getDelegateeOptionsWithReasons(currentDelegations, options)
  }

  async createSmartAccount() {
    if (!this.currentWallet) {
      throw new Error('No wallet connected')
    }

    if (typeof this.currentWallet.createSmartAccount !== 'function') {
      throw new Error(`Current wallet type '${this.currentWallet.getWalletType()}' does not support smart account creation`)
    }

    return await this.currentWallet.createSmartAccount()
  }

  async sendUserOperation(userOp: any) {
    if (!this.currentWallet) {
      throw new Error('No wallet connected')
    }

    if (typeof this.currentWallet.sendUserOperation !== 'function') {
      throw new Error(`Current wallet type '${this.currentWallet.getWalletType()}' does not support user operations`)
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

  // Network detection methods
  async getCurrentChainId(): Promise<number | null> {
    if (!this.currentWallet) {
      return null
    }

    if (typeof this.currentWallet.getCurrentChainId === 'function') {
      try {
        return await this.currentWallet.getCurrentChainId()
      } catch (error) {
        console.error('Failed to get current chain ID:', error)
        return null
      }
    }

    // Fallback to default chain ID for wallets that don't support network detection
    return sepolia.id
  }

  getCurrentNetwork(): { chainId: number; name: string; isSupported: boolean } | null {
    if (!this.currentWallet) {
      return null
    }

    if (typeof this.currentWallet.getCurrentNetwork === 'function') {
      return this.currentWallet.getCurrentNetwork()
    }

    // Fallback to default network for wallets that don't support network detection
    return {
      chainId: sepolia.id,
      name: 'Sepolia Testnet',
      isSupported: true
    }
  }

  // Network switching methods
  async switchNetwork(chainId: number): Promise<void> {
    if (!this.currentWallet) {
      throw new Error('No wallet connected')
    }

    if (typeof this.currentWallet.switchNetwork === 'function') {
      await this.currentWallet.switchNetwork(chainId)
    } else {
      throw new Error(`Current wallet type '${this.currentWallet.getWalletType()}' does not support network switching`)
    }
  }

  async addNetwork(chainId: number): Promise<void> {
    if (!this.currentWallet) {
      throw new Error('No wallet connected')
    }

    if (typeof this.currentWallet.addNetwork === 'function') {
      await this.currentWallet.addNetwork(chainId)
    } else {
      throw new Error(`Current wallet type '${this.currentWallet.getWalletType()}' does not support adding networks`)
    }
  }

  getSupportedNetworks(): Array<{ chainId: number; name: string; isSupported: boolean; isDefault: boolean; chain: any }> {
    if (!this.currentWallet) {
      return []
    }

    if (typeof this.currentWallet.getSupportedNetworks === 'function') {
      return this.currentWallet.getSupportedNetworks()
    }

    // Fallback to default networks for wallets that don't support network listing
    return [
      {
        chainId: sepolia.id,
        name: 'Sepolia Testnet',
        isSupported: true,
        isDefault: true,
        chain: sepolia
      }
    ]
  }

  getDefaultNetwork(): { chainId: number; name: string; isSupported: boolean; isDefault: boolean; chain: any } | null {
    if (!this.currentWallet) {
      return null
    }

    if (typeof this.currentWallet.getDefaultNetwork === 'function') {
      return this.currentWallet.getDefaultNetwork()
    }

    // Fallback to default network for wallets that don't support network listing
    return {
      chainId: sepolia.id,
      name: 'Sepolia Testnet',
      isSupported: true,
      isDefault: true,
      chain: sepolia
    }
  }

  setNetworkChangeCallback(callback: (network: { chainId: number; name: string; isSupported: boolean }) => void): void {
    if (!this.currentWallet) {
      return
    }

    if (typeof this.currentWallet.setNetworkChangeCallback === 'function') {
      this.currentWallet.setNetworkChangeCallback(callback)
    }
  }

  // EIP-7702 delegation status methods
  async checkCurrentDelegation(): Promise<void> {
    if (!this.currentWallet || !this.currentAccount) {
      return
    }

    if (typeof this.currentWallet.checkCurrentDelegation === 'function') {
      await this.currentWallet.checkCurrentDelegation()
    }
  }

  getCurrentDelegation(): string | null {
    if (!this.currentWallet) {
      return null
    }

    if (typeof this.currentWallet.getCurrentDelegation === 'function') {
      return this.currentWallet.getCurrentDelegation()
    }

    return null
  }

  async getCurrentNonce(): Promise<number | null> {
    if (!this.currentWallet) {
      return null
    }

    if (typeof this.currentWallet.getCurrentNonce === 'function') {
      return await this.currentWallet.getCurrentNonce()
    }

    return null
  }
}
