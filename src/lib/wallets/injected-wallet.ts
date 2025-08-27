import { createWalletClient, custom } from 'viem'
import { sepolia } from 'viem/chains'
import { BaseWallet } from './base-wallet'
import {
  type WalletAccount,
  type WalletCapabilities,
  type WalletType
} from '../../types/wallet'
import { type Address, type Hex } from 'viem'
import { type DelegateeContract } from '../../types'
import { addresses } from '../../config/addresses'

// Supported networks configuration - Only Sepolia enabled
const SUPPORTED_NETWORKS = [
  {
    chainId: sepolia.id,
    name: 'Sepolia Testnet',
    isSupported: true,
    isDefault: true,
    chain: sepolia
  }
]

export class InjectedWallet extends BaseWallet {
  private ethereum: any
  private onAccountChange?: (account: WalletAccount | null) => void
  private onNetworkChange?: (network: { chainId: number; name: string; isSupported: boolean }) => void
  private currentChainId: number | null = null
  private currentDelegation: string | null = null
  private currentNonce: number | null = null

  static async isAvailable(): Promise<boolean> {
    if (typeof window === 'undefined') return false
    return !!(window as any).ethereum
  }

  async connect(accountIndex?: number): Promise<WalletAccount> {
    if (!this.ethereum) {
      this.ethereum = (window as any).ethereum
    }

    if (!this.ethereum) {
      throw new Error('No injected wallet available')
    }

    try {
      // Request account access
      const accounts = await this.ethereum.request({
        method: 'eth_requestAccounts'
      })

      if (accounts.length === 0) {
        throw new Error('No accounts found')
      }

      // If accountIndex is provided, use that specific account
      const targetIndex = accountIndex !== undefined ? accountIndex : 0
      if (targetIndex >= accounts.length) {
        throw new Error(`Account index ${targetIndex} is out of range. Available accounts: ${accounts.length}`)
      }

      const address = accounts[targetIndex] as Address
      this.account = this.createAccount(address, 'injected')

      // Get current chain ID
      const chainIdHex = await this.ethereum.request({ method: 'eth_chainId' })
      this.currentChainId = parseInt(chainIdHex, 16)

      // Create wallet client
      this.walletClient = createWalletClient({
        transport: custom(this.ethereum),
        chain: sepolia
      })

      // Set up account change listener
      this.ethereum.on('accountsChanged', async (accounts: string[]) => {
        if (accounts.length === 0) {
          // User disconnected
          this.account = null
          this.currentDelegation = null
          this.currentNonce = null
          if (this.onAccountChange) {
            this.onAccountChange(null)
          }
        } else {
          // User switched accounts
          const newAddress = accounts[0] as Address
          this.account = this.createAccount(newAddress, 'injected')

          // Refresh delegation status for the new account
          await this.checkCurrentDelegation()

          if (this.onAccountChange) {
            this.onAccountChange(this.account)
          }
        }
      })

      // Set up chain change listener
      this.ethereum.on('chainChanged', (chainIdHex: string) => {
        this.currentChainId = parseInt(chainIdHex, 16)
        const network = this.getCurrentNetwork()

        // Notify state change when network changes
        if (this.onAccountChange) {
          this.onAccountChange(this.account)
        }

        // Notify network change
        if (this.onNetworkChange) {
          this.onNetworkChange(network)
        }
      })

      // Notify initial network state immediately after connection
      const initialNetwork = this.getCurrentNetwork()
      if (this.onNetworkChange) {
        this.onNetworkChange(initialNetwork)
      }

      return this.account
    } catch (error) {
      throw new Error(`Failed to connect to injected wallet: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async disconnect(): Promise<void> {
    this.account = null
    this.onAccountChange = undefined
  }

  async getAccount(): Promise<WalletAccount | null> {
    return this.account
  }

  // Get all available accounts from MetaMask
  async getAvailableAccounts(): Promise<WalletAccount[]> {
    if (!this.ethereum) {
      console.log('No injected wallet available, returning empty array')
      return []
    }

    try {
      // Request all accounts (this will prompt user if not already connected)
      const accounts = await this.ethereum.request({
        method: 'eth_requestAccounts'
      })

      if (accounts.length === 0) {
        return []
      }

      // Convert addresses to WalletAccount objects
      return accounts.map((address: string) => this.createAccount(address as Address, 'injected'))
    } catch (error) {
      console.error('Failed to get available accounts:', error)
      return []
    }
  }

  getCapabilities(): WalletCapabilities {
    return {
      canSign: true,
      canSendTransaction: true,
      canSign7702Auth: true,
      canCreateSmartAccount: false
    }
  }

  getWalletType(): WalletType {
    return 'injected'
  }

  // Override delegatee support for MetaMask
  isDelegateeSupported(delegateeAddress: string): boolean {
    return delegateeAddress.toLowerCase() === addresses.delegatee.metamask.toLowerCase()
  }

  // Override getDelegateeOptions to provide MetaMask-specific behavior
  getDelegateeOptions(currentDelegations: string, options: DelegateeContract[]): Array<DelegateeContract & { isSupported: boolean }> {
    const availableOptions = this.filterCurrentDelegatee(currentDelegations, options)
    return availableOptions.map(contract => ({
      ...contract,
      isSupported: this.isDelegateeSupported(contract.address)
    }))
  }

  // Override getDelegateeSupportInfo to provide MetaMask-specific reasons
  getDelegateeSupportInfo(delegateeAddress: string): { isSupported: boolean; reason?: string } {
    const isSupported = this.isDelegateeSupported(delegateeAddress)

    if (isSupported) {
      return { isSupported: true }
    }

    return {
      isSupported: false,
      reason: 'MetaMask only supports delegating to MetaMask deleGator Core'
    }
  }

  // Override getDelegateeOptionsWithReasons for MetaMask
  getDelegateeOptionsWithReasons(currentDelegations: string, options: DelegateeContract[]): Array<DelegateeContract & { isSupported: boolean; reason?: string }> {
    const availableOptions = this.filterCurrentDelegatee(currentDelegations, options)
    return availableOptions.map(contract => ({
      ...contract,
      ...this.getDelegateeSupportInfo(contract.address)
    }))
  }

  // Override signMessage to use personal_sign
  async signMessage(message: string): Promise<Hex> {
    if (!this.ethereum || !this.account) {
      throw new Error('No injected wallet connected')
    }

    const signature = await this.ethereum.request({
      method: 'personal_sign',
      params: [message, this.account.address]
    })

    return signature as Hex
  }

  // Override signTypedData to use eth_signTypedData_v4
  async signTypedData(domain: any, types: any, message: any): Promise<Hex> {
    if (!this.ethereum || !this.account) {
      throw new Error('No injected wallet connected')
    }

    try {
      const signature = await this.ethereum.request({
        method: 'eth_signTypedData_v4',
        params: [this.account.address, JSON.stringify({
          types,
          primaryType: 'Permit',
          domain,
          message
        })]
      })
      return signature as Hex
    } catch (error) {
      // Fallback to personal_sign if eth_signTypedData_v4 is not supported
      const messageStr = JSON.stringify({ domain, types, message })
      return await this.signMessage(`0x${Buffer.from(messageStr, 'utf8').toString('hex')}`)
    }
  }

  // Override signPermit for ERC20 permit signing
  async signPermit(amount: bigint): Promise<any> {
    if (!this.ethereum || !this.account) {
      throw new Error('No injected wallet connected')
    }

    // This is a simplified implementation
    // In a real app, you'd need to get the token contract details and nonce
    const domain = {
      name: 'USDC',
      version: '1',
      chainId: 11155111, // Sepolia
      verifyingContract: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238' // Sepolia USDC
    }

    const types = {
      Permit: [
        { name: 'owner', type: 'address' },
        { name: 'spender', type: 'address' },
        { name: 'value', type: 'uint256' },
        { name: 'nonce', type: 'uint256' },
        { name: 'deadline', type: 'uint256' }
      ]
    }

    const message = {
      owner: this.account.address,
      spender: '0x856c363e043Ac34B19D584D3930bfa615947994E',
      value: amount.toString(),
      nonce: '0', // This should be fetched from the contract
      deadline: Math.floor(Date.now() / 1000) + 3600 // 1 hour from now
    }

    try {
      const signature = await this.ethereum.request({
        method: 'eth_signTypedData_v4',
        params: [this.account.address, JSON.stringify({
          types,
          primaryType: 'Permit',
          domain,
          message
        })]
      })

      return {
        owner: message.owner,
        spender: message.spender,
        value: message.value,
        nonce: message.nonce,
        deadline: message.deadline,
        r: signature.slice(0, 66),
        s: '0x' + signature.slice(66, 130),
        v: parseInt(signature.slice(130, 132), 16)
      }
    } catch (error) {
      throw new Error(`Failed to sign permit: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Override sign7702Authorization for MetaMask
  // Note: MetaMask doesn't expose sign7702Auth directly, but handles atomic batching through wallet_sendCalls
  async sign7702Authorization(authorizationData: any): Promise<any> {
    if (!this.ethereum || !this.account) {
      throw new Error('No injected wallet connected')
    }

    try {
      // Get current account and chain ID
      const [from] = await this.ethereum.request({ method: 'eth_requestAccounts' });
      const chainIdHex = "0xaa36a7";// TODO: await this.ethereum.request({ method: 'eth_chainId' });

      // Check atomic batching capabilities
      const caps = await this.ethereum.request({
        method: 'wallet_getCapabilities',
        params: [from, [chainIdHex]],
      });

      const atomic = caps?.[chainIdHex]?.atomic?.status; // "ready" | "supported"
      if (!atomic) {
        throw new Error('Atomic batching unsupported on this chain');
      }

      // For EIP-7702, we return the capability status and account info
      // The actual authorization happens during submit7702Authorization
      return {
        account: from,
        chainId: chainIdHex,
        atomicStatus: atomic,
        supportsAtomic: true
      };
    } catch (error) {
      throw new Error(`Failed to check EIP-7702 capabilities: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

    // EIP-7702 delegation status methods
  async checkCurrentDelegation(): Promise<void> {
    console.log('🔍 Starting delegation check...');

    if (!this.ethereum) {
      console.log('❌ No ethereum provider available');
      this.currentDelegation = null;
      this.currentNonce = null;
      return;
    }

    if (!this.account) {
      console.log('❌ No account connected');
      this.currentDelegation = null;
      this.currentNonce = null;
      return;
    }

    try {
      console.log(`🔍 Checking delegation for account: ${this.account.address}`);

      // Get current account
      const [from] = await this.ethereum.request({ method: 'eth_requestAccounts' });
      console.log(`📋 Current account from provider: ${from}`);

      // Check if the account has any code (indicating it might be a smart account)
      const code = await this.ethereum.request({
        method: 'eth_getCode',
        params: [from, 'latest']
      });
      console.log(`📋 Account code: ${code}`);

      // For EIP-7702, we need to check if the account has been delegated
      // This is a simplified check - in a real implementation, you'd query the delegation contract
      if (code === '0x' || code === '0x0') {
        // Regular EOA - not delegated
        this.currentDelegation = null;
        console.log('✅ Account is not delegated (EOA)');
      } else {
        // Account has code - might be delegated
        // For now, we'll assume it's delegated to the MetaMask deleGator
        this.currentDelegation = addresses.delegatee.metamask;
        console.log('✅ Account appears to be delegated');
      }

      // Get current nonce
      const nonce = await this.ethereum.request({
        method: 'eth_getTransactionCount',
        params: [from, 'latest']
      });

      this.currentNonce = parseInt(nonce, 16);
      console.log(`📊 Current nonce: ${this.currentNonce}`);
      console.log(`📋 Final delegation status: ${this.currentDelegation || 'Not delegated'}`);

      // Force a state update by calling the callback
      if (this.onAccountChange) {
        console.log('🔄 Triggering state update...');
        this.onAccountChange(this.account);
      }
    } catch (error) {
      console.error('❌ Failed to check current delegation:', error);
      // Set to not delegated on error
      this.currentDelegation = null;
      this.currentNonce = null;
    }
  }

  // Helper method to check delegation status by querying the delegation contract
  private async checkDelegationStatus(accountAddress: string): Promise<string | null> {
    try {
      // Query the delegation contract to check if the account is delegated
      // This would require the delegation contract ABI and proper contract calls
      // For now, we'll use a simplified approach

      // Check if the account has any code (indicating it might be a smart account)
      const code = await this.ethereum.request({
        method: 'eth_getCode',
        params: [accountAddress, 'latest']
      });

      if (code === '0x' || code === '0x0') {
        return null; // Not delegated
      }

      // If the account has code, we need to determine what it's delegated to
      // This would require querying the specific delegation contract
      // For now, we'll return the MetaMask deleGator address as a placeholder
      return addresses.delegatee.metamask;
    } catch (error) {
      console.error('Error checking delegation status:', error);
      return null;
    }
  }

  getCurrentDelegation(): string | null {
    return this.currentDelegation;
  }

  getCurrentNonce(): number | null {
    return this.currentNonce;
  }

  // Override submit7702Authorization to handle EIP-7702 authorization submission
  async submit7702Authorization(signedAuthorization: any): Promise<Hex> {
    console.log('🔧 InjectedWallet.submit7702Authorization called with:', signedAuthorization)

    if (!this.ethereum || !this.account) {
      throw new Error('No injected wallet available')
    }

    try {
      // Get current account and use Sepolia chain ID
      const [from] = await this.ethereum.request({ method: 'eth_requestAccounts' });
      const chainIdHex = '0xaa36a7'; // Sepolia chain ID

      // Check atomic batching capabilities
      const caps = await this.ethereum.request({
        method: 'wallet_getCapabilities',
        params: [from, [chainIdHex]],
      });
      console.log('caps', caps);

      const atomic = caps?.[chainIdHex]?.atomic?.status;
      if (!atomic) {
        throw new Error('Atomic batching unsupported on this chain');
      }

      // Check if wallet_sendCalls method is available
      console.log('🔍 Checking if wallet_sendCalls is available...')
      if (typeof this.ethereum.request !== 'function') {
        throw new Error('ethereum.request is not available');
      }

      // Log the ethereum object to see what methods are available
      console.log('🔍 Ethereum object methods:', Object.getOwnPropertyNames(this.ethereum));
      console.log('🔍 Ethereum object:', this.ethereum);


      const callObject = {
        version: '2.0.0',
        from,
        chainId: chainIdHex,
        atomicRequired: true,
        calls: [
          { to: from, value: '0x0' },
          { to: from, value: '0x0' },
        ],
      }

      // Submit atomic batch using wallet_sendCalls
      console.log('📤 Attempting to call wallet_sendCalls with params:', callObject)

      let batchId: string;
      try {
        const result = await this.ethereum.request({
          method: 'wallet_sendCalls',
          params: [callObject],
        });
        batchId = result.id;
        console.log('✅ wallet_sendCalls succeeded, batchId:', batchId);
      } catch (sendError) {
        console.error('❌ wallet_sendCalls failed:', sendError);
        console.error('❌ sendError type:', typeof sendError);
        console.error('❌ sendError message:', (sendError as any)?.message);

        // If wallet_sendCalls fails, fail fast - no fallback
        throw new Error(`wallet_sendCalls failed: ${(sendError as any)?.message || 'Unknown error'}`);
      }

      // Optional: poll status to get transaction hash
      const status = await this.ethereum.request({
        method: 'wallet_getCallsStatus',
        params: [batchId],
      });
      console.log('status', status);

      console.log('✅ EIP-7702 authorization submitted successfully, batch ID:', batchId)

      // Return the batch ID as the transaction hash for now
      // In a real implementation, you might want to wait for the status to be 'confirmed'
      return batchId as Hex;
    } catch (error: unknown) {
      console.error('❌ Error in submit7702Authorization:', error)
      console.error('❌ Error type:', typeof error)
      console.error('❌ Error constructor:', (error as any)?.constructor?.name)
      console.error('❌ Error message:', (error as any)?.message)
      console.error('❌ Error stack:', (error as any)?.stack)

      // Try to get more details about the error
      let errorMessage = 'Unknown error'
      if (error instanceof Error) {
        errorMessage = error.message
      } else if (typeof error === 'string') {
        errorMessage = error
      } else if (error && typeof error === 'object') {
        errorMessage = JSON.stringify(error)
      }

      throw new Error(`Failed to submit 7702 authorization: ${errorMessage}`)
    }
  }

  setAccountChangeCallback(callback: (account: WalletAccount | null) => void): void {
    this.onAccountChange = callback
  }

  setNetworkChangeCallback(callback: (network: { chainId: number; name: string; isSupported: boolean }) => void): void {
    this.onNetworkChange = callback
  }

  // Network detection methods - Detect actual chain from MetaMask
  async getCurrentChainId(): Promise<number> {
    if (!this.ethereum) {
      throw new Error('No injected wallet available')
    }

    try {
      const chainIdHex = await this.ethereum.request({ method: 'eth_chainId' })
      this.currentChainId = parseInt(chainIdHex, 16)
      return this.currentChainId
    } catch (error) {
      throw new Error(`Failed to get chain ID: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  getCurrentNetwork(): { chainId: number; name: string; isSupported: boolean } {
    const chainId = this.currentChainId || sepolia.id
    const network = SUPPORTED_NETWORKS.find(n => n.chainId === chainId)

    if (network) {
      return {
        chainId: network.chainId,
        name: network.name,
        isSupported: network.isSupported
      }
    }

    // If it's not in our supported networks, return unknown network info
    return {
      chainId,
      name: `Chain ID ${chainId}`,
      isSupported: false
    }
  }

  getSupportedNetworks() {
    return SUPPORTED_NETWORKS
  }

  getDefaultNetwork() {
    return SUPPORTED_NETWORKS[0]
  }

  // Network switching methods - Only Sepolia supported
  async switchNetwork(chainId: number): Promise<void> {
    if (chainId !== sepolia.id) {
      throw new Error('Only Sepolia network is supported')
    }
    // No action needed since we only support Sepolia
  }

  async addNetwork(chainId: number): Promise<void> {
    if (chainId !== sepolia.id) {
      throw new Error('Only Sepolia network is supported')
    }
    // No action needed since we only support Sepolia
  }
}
