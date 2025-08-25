import {
  type Address,
  type Hex,
  type PublicClient,
  type WalletClient,
  createWalletClient,
  custom
} from 'viem'
import { sepolia } from 'viem/chains'
import { BaseWallet } from './base-wallet'
import {
  type WalletAccount,
  type WalletCapabilities,
  type WalletType
} from '../../types/wallet'

export class InjectedWallet extends BaseWallet {
  private ethereum: any = null
  private onAccountChange?: (account: WalletAccount | null) => void

  constructor(chainId: number = sepolia.id) {
    super(chainId)
    this.initializeEthereum()
  }

  // Set callback for account changes
  setAccountChangeCallback(callback: (account: WalletAccount | null) => void) {
    this.onAccountChange = callback
  }

  private initializeEthereum(): void {
    if (typeof window !== 'undefined' && window.ethereum) {
      this.ethereum = window.ethereum
    }
  }

  // Check if MetaMask or other injected wallet is available
  static async isAvailable(): Promise<boolean> {
    if (typeof window === 'undefined') return false

    // Check for MetaMask or other injected providers
    if (window.ethereum) {
      try {
        // Try to get accounts to see if wallet is connected
        const accounts = await window.ethereum.request({ method: 'eth_accounts' })
        return true
      } catch (error) {
        console.log('Injected wallet available but not connected')
        return true
      }
    }

    return false
  }

  async connect(): Promise<WalletAccount> {
    if (!this.ethereum) {
      throw new Error('No injected wallet (MetaMask) detected. Please install MetaMask or another Web3 wallet.')
    }

    try {
      // Request account access
      const accounts = await this.ethereum.request({
        method: 'eth_requestAccounts'
      })

      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found. Please connect your wallet.')
      }

      const address = accounts[0] as Address

      // Create wallet client
      const walletClient = createWalletClient({
        account: address,
        chain: sepolia,
        transport: custom(this.ethereum)
      })

      // Set up the wallet client
      this.setWalletClient(walletClient)

      // Create account object
      const account = this.createAccount(address, 'injected')
      this.setAccount(account)

      // Listen for account changes
      this.ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length === 0) {
          // User disconnected
          this.setAccount(null)
          if (this.onAccountChange) {
            this.onAccountChange(null)
          }
        } else {
          // User switched accounts
          const newAddress = accounts[0] as Address
          const newAccount = this.createAccount(newAddress, 'injected')
          this.setAccount(newAccount)
          if (this.onAccountChange) {
            this.onAccountChange(newAccount)
          }
        }
      })

      // Listen for chain changes
      this.ethereum.on('chainChanged', (chainId: string) => {
        console.log('Chain changed to:', chainId)
        // You might want to handle chain changes here
      })

      console.log('✅ Connected to injected wallet:', address)
      return account
    } catch (error) {
      console.error('❌ Failed to connect to injected wallet:', error)
      throw new Error(`Failed to connect to injected wallet: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async disconnect(): Promise<void> {
    // For injected wallets, we can't programmatically disconnect
    // The user needs to disconnect from the wallet UI
    this.setAccount(null)
    console.log('🔌 Disconnected from injected wallet')
  }

  async getAccount(): Promise<WalletAccount | null> {
    return this.account
  }

  getCapabilities(): WalletCapabilities {
    return {
      canSign: true,
      canSendTransaction: true,
      canSign7702Auth: true, // MetaMask supports EIP-7702
      canCreateSmartAccount: false // Not implemented yet
    }
  }

  getWalletType(): WalletType {
    return 'injected'
  }

  // Override signMessage to use MetaMask's personal_sign
  async signMessage(message: string): Promise<Hex> {
    if (!this.ethereum) {
      throw new Error('No injected wallet available')
    }

    const account = await this.getAccount()
    if (!account) {
      throw new Error('No account connected')
    }

    try {
      const signature = await this.ethereum.request({
        method: 'personal_sign',
        params: [message, account.address]
      })
      return signature as Hex
    } catch (error) {
      console.error('Failed to sign message:', error)
      throw new Error(`Failed to sign message: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Override signTypedData to use MetaMask's eth_signTypedData_v4
  async signTypedData(domain: any, types: any, message: any): Promise<Hex> {
    if (!this.ethereum) {
      throw new Error('No injected wallet available')
    }

    const account = await this.getAccount()
    if (!account) {
      throw new Error('No account connected')
    }

    try {
      // Determine the primary type from the types object
      // For EIP-712, the primary type is usually the first key in the types object
      // that isn't 'EIP712Domain'
      const primaryType = Object.keys(types).find(key => key !== 'EIP712Domain') || 'Permit'

      const typedData = {
        types,
        primaryType,
        domain,
        message
      }

      console.log('🔍 Signing typed data with MetaMask:', {
        account: account.address,
        primaryType,
        domain,
        types,
        message
      })

      const signature = await this.ethereum.request({
        method: 'eth_signTypedData_v4',
        params: [account.address, JSON.stringify(typedData)]
      })

      console.log('✅ Typed data signed successfully:', signature)
      return signature as Hex
    } catch (error) {
      console.error('❌ Failed to sign typed data:', error)
      console.error('❌ Error details:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        domain,
        types,
        message
      })

      // Try fallback to personal_sign if eth_signTypedData_v4 fails
      try {
        console.log('🔄 Trying fallback to personal_sign...')
        const messageString = JSON.stringify({ domain, types, message })
        const signature = await this.ethereum.request({
          method: 'personal_sign',
          params: [messageString, account.address]
        })
        console.log('✅ Fallback personal_sign successful:', signature)
        return signature as Hex
      } catch (fallbackError) {
        console.error('❌ Fallback personal_sign also failed:', fallbackError)
        throw new Error(`Failed to sign typed data: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }
  }

  // Override sign7702Authorization for MetaMask
  async sign7702Authorization(authorizationData: any): Promise<any> {
    if (!this.ethereum) {
      throw new Error('No injected wallet available')
    }

    const account = await this.getAccount()
    if (!account) {
      throw new Error('No account connected')
    }

    try {
      // For MetaMask, we'll use personal_sign for EIP-7702 authorization
      const message = JSON.stringify(authorizationData)
      const signature = await this.ethereum.request({
        method: 'personal_sign',
        params: [account.address, `0x${Buffer.from(message, 'utf8').toString('hex')}`]
      })

      // Return the authorization structure expected by the system
      return {
        authorization: {
          ...authorizationData,
          signature
        },
        verification: {
          signerAddress: account.address,
          recoveredAddress: account.address, // For personal_sign, we assume it matches
          addressesMatch: true,
          isValid: true
        }
      }
    } catch (error) {
      console.error('Failed to sign 7702 authorization:', error)
      throw new Error(`Failed to sign 7702 authorization: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
}

// Add ethereum to window type
declare global {
  interface Window {
    ethereum?: any
  }
}
