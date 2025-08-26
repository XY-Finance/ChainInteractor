import { BaseWallet } from './base-wallet'
import { createWalletClient, custom } from 'viem'
import { sepolia } from 'viem/chains'
import {
  type WalletAccount,
  type WalletCapabilities,
  type WalletType
} from '../../types/wallet'
import { type Address, type Hex } from 'viem'
import { type DelegateeContract } from '../../types'

export class InjectedWallet extends BaseWallet {
  private ethereum: any
  private onAccountChange?: (account: WalletAccount | null) => void

  static async isAvailable(): Promise<boolean> {
    if (typeof window === 'undefined') return false
    return !!(window as any).ethereum
  }

  async connect(): Promise<WalletAccount> {
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

      const address = accounts[0] as Address
      this.account = this.createAccount(address, 'injected')

      // Create wallet client
      this.walletClient = createWalletClient({
        transport: custom(this.ethereum),
        chain: sepolia
      })

      // Set up account change listener
      this.ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length === 0) {
          // User disconnected
          this.account = null
          if (this.onAccountChange) {
            this.onAccountChange(null)
          }
        } else {
          // User switched accounts
          const newAddress = accounts[0] as Address
          this.account = this.createAccount(newAddress, 'injected')
          if (this.onAccountChange) {
            this.onAccountChange(this.account)
          }
        }
      })

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
    // MetaMask only supports delegating to the specific 0x63c... contract
    // It does NOT support revocation or any other delegatees
    const supportedAddresses: string[] = [
      // Add the specific MetaMask supported contract address here
      '0x63c0c19a282a1b52b07dd5a65b58948a07dae32b'
    ]

    return supportedAddresses.includes(delegateeAddress.toLowerCase())
  }

  // Override getDelegateeOptions to provide MetaMask-specific behavior
  getDelegateeOptions(currentDelegations: string, options: DelegateeContract[]): Array<DelegateeContract & { isSupported: boolean }> {
    const availableOptions = this.getAvailableDelegatees(currentDelegations, options)
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
    const availableOptions = this.getAvailableDelegatees(currentDelegations, options)
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
}
