import { sepolia } from 'viem/chains'
import { DELEGATEE_CONTRACTS } from './delegateeContracts'

// EIP-7702 Configuration
export const EIP7702_CONFIG = {
  // Supported networks
  networks: {
    sepolia: {
      chain: sepolia,
      bundlerUrl: 'https://bundler.sepolia.zerodev.app',
      rpcUrl: 'https://rpc.sepolia.org',
    },
  },

  // Default network
  defaultNetwork: sepolia,

  // Gas settings for user operations
  gasSettings: {
    maxFeePerGas: BigInt(1),
    maxPriorityFeePerGas: BigInt(1),
  },

  // Delegatee contracts configuration - imported from centralized config
  delegateeContracts: DELEGATEE_CONTRACTS,

  // UI settings
  ui: {
    logRetention: 100, // Number of log entries to keep
    autoScroll: true, // Auto-scroll logs
    showTimestamps: true, // Show timestamps in logs
  },

  // Error handling
  errorHandling: {
    maxRetries: 3,
    retryDelay: 1000, // ms
    showDetailedErrors: true,
  },
}

// Helper function to get network configuration
export function getNetworkConfig(chainId: number) {
  return Object.values(EIP7702_CONFIG.networks).find(
    network => network.chain.id === chainId
  )
}

// Helper function to validate address
export function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address)
}

// Helper function to format address for display
export function formatAddress(address: string, length: number = 8): string {
  if (!isValidAddress(address)) return address
  return `${address.slice(0, length + 2)}...${address.slice(-length)}`
}
