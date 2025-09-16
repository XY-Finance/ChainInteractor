# Address Configuration

This directory contains centralized configuration files for managing addresses used throughout the application.

## Addresses Configuration (`addresses.ts`)

The `addresses.ts` file provides a centralized location for all common addresses used in the application.

### Structure

```typescript
export const addresses = {
  // Token addresses
  token: {
    USDC: '0x1c7D4C1965230EE5525eFb6e5D7c5C9E4b8f7238' as Address,
  },

  // Common user addresses
  common: {
    user0: '0x856c363e043Ac34B19D584D3930bfa615947994E' as Address,
    user1: '0x51c7D4C1965230EE5525eFb6e5D7c5C9E4b8f7238' as Address,
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
}
```

### Usage

#### Direct Import
```typescript
import { addresses } from '../config/addresses'

// Access addresses
const usdcAddress = addresses.token.USDC
const zeroAddress = addresses.eoa.zero
const metamaskDelegatee = addresses.delegatee.metamask
const kernelDelegatee = addresses.delegatee.kernel
```

#### Helper Function
```typescript
import { getAddress } from '../config/addresses'

// Get address with type safety
const usdcAddress = getAddress('token.USDC')
const zeroAddress = getAddress('common.zero')
```

#### Convenience Exports
```typescript
import { token, common, delegatee } from '../config/addresses'

const usdcAddress = token.USDC
const zeroAddress = common.zero
const metamaskDelegatee = delegatee.metamask
const kernelDelegatee = delegatee.kernel
```

### Benefits

1. **Centralized Management**: All addresses in one place
2. **Type Safety**: TypeScript ensures address validity
3. **Easy Updates**: Change addresses in one location
4. **Environment Support**: Different addresses for different networks
5. **Consistency**: Ensures same addresses used throughout the app

### Adding New Addresses

1. Add the address to the appropriate section in `addresses.ts`
2. Use the `Address` type from viem for type safety
3. Update this README if adding new sections

### Best Practices

- Always use the centralized addresses instead of hardcoding
- Use the `Address` type for type safety
- Group related addresses together (tokens, users, contracts, etc.)
- Consider network-specific addresses for multi-chain support
- Document any address changes in commit messages
