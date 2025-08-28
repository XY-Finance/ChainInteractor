import { type Address } from 'viem'

// Address configuration for different environments and common addresses
export const addresses = {
  // Token addresses
  token: {
    USDC: '0x1c7D4C1965230EE5525eFb6e5D7c5C9E4b8f7238' as Address,
    // Add other tokens as needed
  },

  // Common user addresses
  common: {
    user0: '0x856c363e043Ac34B19D584D3930bfa615947994E' as Address,
    user1: '0x9C9F55ebc51D0D606227790d14Afcb706178dE98' as Address,
    user2: '0x51c7D4C1965230EE5525eFb6e5D7c5C9E4b8f7238' as Address,
    zero: '0x0000000000000000000000000000000000000000' as Address,
  },

  // Delegatee contract addresses
  delegatee: {
    metamask: '0x63c0c19a282a1b52b07dd5a65b58948a07dae32b' as Address,
    kernel: '0xd6CEDDe84be40893d153Be9d467CD6aD37875b28' as Address,
  },

  // Contract addresses by network
  contracts: {
    sepolia: {
      // Add Sepolia-specific contract addresses
    },
    mainnet: {
      // Add mainnet-specific contract addresses
    },
  },
} as const

// Type-safe access to addresses
export type AddressConfig = typeof addresses

// Helper function to get address with type safety
export function getAddress(path: keyof AddressConfig | `${keyof AddressConfig}.${string}`): Address {
  const keys = path.split('.') as (keyof AddressConfig)[]
  let current: any = addresses

  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = current[key]
    } else {
      throw new Error(`Invalid address path: ${path}`)
    }
  }

  if (typeof current === 'string') {
    return current as Address
  }

  throw new Error(`Invalid address path: ${path}`)
}

// Convenience exports for commonly used addresses
export const {
  token,
  common,
  delegatee,
  contracts,
} = addresses

// Export the main config object
export default addresses
