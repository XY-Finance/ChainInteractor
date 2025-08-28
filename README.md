# EIP-7702 Demo Project

A Next.js application demonstrating EIP-7702 smart account functionality using both ZeroDev and MetaMask Delegation Toolkit implementations. This project showcases how to upgrade Externally Owned Accounts (EOAs) to support smart account functionality with advanced loading states and user experience optimizations.

## 🏗️ Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page (redirects to EIP-7702)
│   ├── favicon.ico        # App favicon
│   ├── api/               # API routes
│   │   ├── local-addresses/    # Local addresses API
│   │   ├── wallet-operations/  # Wallet operations API
│   │   └── wallet-status/      # Wallet status API
│   ├── components/        # App-specific components
│   ├── config/           # App configuration
│   ├── eip7702/          # EIP-7702 route
│   ├── metamask-debug/   # MetaMask debugging tools
│   ├── metamask-permits/ # MetaMask permits demo
│   ├── performance-demo/ # Performance demonstration
│   ├── wallet-actions/   # Wallet operations route
│   ├── wallet-demo/      # Wallet demo (legacy)
│   └── zerodev/          # ZeroDev route
├── components/            # Reusable UI components
│   ├── ui/               # Basic UI components
│   │   ├── PageSkeleton.tsx  # Reusable skeleton loading component
│   │   ├── Button.tsx        # Button component
│   │   ├── Card.tsx          # Card component
│   │   ├── NetworkSelector.tsx # Network selection component
│   │   └── index.ts          # UI components export
│   ├── layout/           # Layout components
│   │   ├── Navigation.tsx
│   │   ├── GlobalWalletManager.tsx
│   │   └── ClientWrapper.tsx
│   ├── wallet/           # Wallet-specific components
│   │   ├── WalletSelector.tsx
│   │   ├── WalletOperations.tsx
│   │   └── index.ts
│   └── features/         # Feature-specific components
├── features/             # Feature modules
│   ├── eip7702/         # EIP-7702 MetaMask implementation
│   ├── metamask-permits/ # MetaMask permits feature
│   ├── wallet-actions/  # Wallet operations
│   │   ├── page.tsx
│   │   ├── components/  # Wallet action components
│   │   │   ├── WalletStatus.tsx
│   │   │   ├── UseCaseCard.tsx
│   │   │   ├── EIP7702Authorization.tsx
│   │   │   ├── ERC20Permit.tsx
│   │   │   └── OperationLogs.tsx
│   │   ├── types/       # Type definitions
│   │   └── utils/       # Utility functions
│   ├── wallet-demo/     # Wallet demo (legacy)
│   └── zerodev/         # ZeroDev implementation
├── lib/                  # Library configurations
│   ├── providers.tsx     # Wagmi providers
│   └── wallets/          # Modular wallet system
│       ├── base-wallet.ts
│       ├── local-key-wallet.ts
│       ├── injected-wallet.ts
│       └── wallet-manager.ts
├── hooks/                # Custom React hooks
│   ├── useEIP7702.ts     # EIP-7702 business logic
│   ├── useWalletManager.ts # Wallet management hook
│   └── useWalletState.ts # Wallet state management
├── contexts/             # React contexts
│   └── WalletContext.tsx # Global wallet state management
├── types/                # TypeScript type definitions
│   ├── index.ts
│   └── wallet.ts         # Wallet type definitions
├── utils/                # Utility functions
│   └── index.ts
├── config/               # Configuration files
│   ├── config.ts         # Wagmi configuration
│   ├── eip7702.ts        # EIP-7702 settings
│   ├── delegateeContracts.ts # Centralized delegatee contract configuration
│   ├── addresses.ts      # Contract addresses
│   ├── index.ts          # Configuration exports
│   └── README.md         # Configuration documentation
└── styles/               # Global styles
    └── globals.css
```

scripts/                  # Command-line scripts
├── demo/                 # Demo scripts
│   └── demo-eip7702.ts
└── examples/             # Example implementations
    ├── run-7702-example.ts
    ├── run-7702-example-no-sponsor.ts
    └── check-account.ts

docs/                     # Documentation
├── api/                  # API documentation
├── guides/               # User guides
│   └── EIP7702_README.md
└── examples/             # Code examples
```

## 🚀 Features

### Advanced Loading State Management
- 🎨 **Skeleton Loading**: Modern skeleton UI components for improved perceived performance
- ⚡ **Granular Loading**: Smart loading states that only affect relevant UI sections
- 🔄 **Auto-Connection**: Seamless wallet auto-connection with proper loading feedback
- 📱 **Responsive Design**: Optimized loading states for all screen sizes
- 🎯 **Context-Aware Loading**: Different loading states for different operations (auto-connect, account switching, delegation checking)

### Modular Wallet System
- 🔑 **Local Private Key Wallet**: Environment-based private key management
  - Supports multiple private keys from `.env` file
  - Legacy format: `PRIVATE_KEYS="0x111... 0x222... 0x333..."`
  - Dynamic format: `KEY0=0x111...`, `KEY1=0x222...`, etc.
  - Full EIP-7702 support with authorization signing
  - Smart account creation and user operation sending
- 🌐 **Injected Wallet (MetaMask)**: Browser wallet integration
  - MetaMask and other injected wallet support
  - EIP-7702 with personal_sign implementation
  - EIP-712 typed data signing
  - User-friendly interface
- 🔒 **Embedded Wallet (Coming Soon)**: Privy integration
  - Social login support
  - Gasless transactions
  - Enhanced user experience
- ⚡ **Cross-Wallet EIP-7702 Features**:
  - Authorization signing across all wallet types
  - Smart account creation
  - User operation sending
  - Delegatee contract filtering and support checking

### ZeroDev Implementation
- 🔐 Smart Account creation with EIP-7702
- 💰 Send transactions with smart account
- 🎨 Modern UI with Tailwind CSS
- 🔗 Wallet connection with RainbowKit
- ⚡ Real-time transaction status

### MetaMask Delegation Toolkit Implementation
- 🚀 EIP-7702 authorization for delegatee contracts
- 🔧 MetaMask deleGator Core integration
- 📝 Smart account creation using MetaMask's toolkit
- 📤 User operation sending through upgraded EOAs
- 📊 Real-time operation logging

## 🛠️ Technology Stack

- **Framework**: [Next.js 15](https://nextjs.org/) with App Router
- **Smart Accounts**: [ZeroDev SDK](https://docs.zerodev.app/) & [MetaMask Delegation Toolkit](https://docs.metamask.io/delegation-toolkit/)
- **Ethereum**: [Viem](https://viem.sh/) & [Wagmi](https://wagmi.sh/)
- **UI**: [RainbowKit](https://www.rainbowkit.com/) & [Tailwind CSS](https://tailwindcss.com/)
- **Language**: TypeScript
- **Package Manager**: npm

## 📋 Prerequisites

- Node.js 18+
- MetaMask wallet
- Sepolia testnet ETH

## 🚀 Quick Start

### 1. Installation

```bash
# Clone the repository
git clone <repository-url>
cd try7702

# Install dependencies
npm install
```

### 2. Environment Setup

Create a `.env.local` file:

```env
# ZeroDev Project ID (get from https://dashboard.zerodev.app)
ZERODEV_PROJECT_ID=your_zerodev_project_id_here

# Your private keys for testing (REQUIRED - quoted space-separated format)
PRIVATE_KEYS="0x111...111 0x222...222 0x333...333"

# Optional: WalletConnect Project ID
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id_here
```

**⚠️ Security Notes:**
- Never commit `.env.local` to version control
- Keep your ZeroDev Project ID private
- Use test accounts for development

### 3. Wallet Configuration

The Modular Wallet System supports multiple private key formats:

#### Legacy Format (Space-separated)
```env
PRIVATE_KEYS="0x1111111111111111111111111111111111111111111111111111111111111111 0x2222222222222222222222222222222222222222222222222222222222222222"
```

#### Dynamic Format (Individual keys)
```env
KEY0=0x1111111111111111111111111111111111111111111111111111111111111111
KEY1=0x2222222222222222222222222222222222222222222222222222222222222222
KEY2=0x3333333333333333333333333333333333333333333333333333333333333333
```

#### Supported Wallet Types

1. **Local Private Key Wallet** (Fully Implemented)
   - Reads from environment variables
   - Supports multiple key formats
   - Full EIP-7702 functionality

2. **Injected Wallet** (MetaMask - Fully Implemented)
   - Browser wallet integration
   - EIP-7702 with personal_sign
   - Account change detection

3. **Embedded Wallet** (Privy - Coming Soon)
   - Social login support
   - Gasless transactions
   - Enhanced UX

### 3. Development

```bash
# Start development server
npm run dev

# Open http://localhost:3000
```

## 📖 Available Scripts

```bash
# Development
npm run dev              # Start development server
npm run build            # Build for production
npm run start            # Start production server
npm run lint             # Run ESLint

# Examples
npm run run-7702         # Run ZeroDev EIP-7702 example
npm run demo-metamask-7702 # Run MetaMask Delegation Toolkit example
npm run check-account    # Check account status
```

## 🎯 Usage

### Advanced Loading States

The application implements sophisticated loading state management:

#### Loading State Types
- **Initial Page Load**: Full-page skeleton loading during app initialization
- **Auto-Connection**: Skeleton loading when automatically connecting to KEY0
- **Account Switching**: Granular loading for wallet status during account changes
- **Delegation Checking**: Smart loading states for delegation status verification

#### Granular Loading Implementation
- **PageSkeleton Component**: Reusable skeleton UI for consistent loading experience
- **Context-Aware Loading**: Different loading states for different operations
- **Non-Blocking UI**: Available actions remain interactive during wallet operations
- **Smart State Management**: Loading states managed through React Context

### Modular Wallet System

The Modular Wallet System provides a unified interface for managing multiple wallet types:

#### Wallet Connection
1. **Select Wallet Type**: Choose from available wallet types (Local Private Key, MetaMask, etc.)
2. **Configure Keys**: For local wallets, select from available private keys
3. **Connect**: Establish connection and verify account access
4. **Switch**: Seamlessly switch between different wallet types

#### EIP-7702 Operations
1. **Authorization**: Sign EIP-7702 authorizations for delegatee contracts
2. **Smart Account Creation**: Create MetaMask Smart Account instances
3. **User Operations**: Send transactions through upgraded accounts
4. **Delegatee Management**: Filter and validate supported contracts

#### Cross-Wallet Features
- **Unified API**: Same interface across all wallet types
- **Capability Detection**: Automatic feature support checking
- **Delegatee Filtering**: Smart contract compatibility validation
- **State Management**: Consistent wallet state across the application

### Web Interface

1. **Connect Wallet**: Use the Connect Wallet button
2. **Choose Implementation**:
   - **EIP-7702 Authorization**: `/eip7702` for MetaMask Delegation Toolkit
   - **Wallet Actions**: `/wallet-actions` for wallet operations
   - **ZeroDev Demo**: `/zerodev` for ZeroDev EIP-7702
3. **Follow the Steps**: Each implementation has a guided workflow

### Command Line

```bash
# Run ZeroDev example
npm run run-7702

# Run MetaMask example
npm run demo-metamask-7702

# Check account status
npm run check-account
```

## 🏛️ Architecture

### Loading State Architecture

The application implements a sophisticated loading state management system:

#### Core Components

- **`src/contexts/WalletContext.tsx`**: Centralized wallet state management
  - Global loading states (`isAutoConnecting`, `isRenewingAccount`)
  - Wallet connection and account management
  - Delegation status tracking
  - Non-blocking UI rendering

- **`src/components/ui/PageSkeleton.tsx`**: Reusable skeleton loading component
  - Consistent loading UI across the application
  - Mimics main page structure during loading
  - Animated pulse effects for better UX

- **`src/features/wallet-actions/components/`**: Granular loading components
  - `WalletStatus.tsx`: Context-aware loading for wallet status
  - `UseCaseCard.tsx`: Interactive action cards with loading states
  - `OperationLogs.tsx`: Real-time operation logging

#### Loading State Flow

1. **Initial Load**: `PageSkeleton` displayed during app initialization
2. **Auto-Connection**: Skeleton loading when connecting to default account
3. **Account Switching**: Granular loading for wallet status section
4. **Delegation Checking**: Smart loading states for delegation verification
5. **Action Execution**: Non-blocking loading for specific operations

#### State Management

- **`isAutoConnecting`**: Tracks automatic wallet connection process
- **`isRenewingAccount`**: Combines delegation checking and account switching
- **`isLoading`**: General loading state for wallet operations
- **Granular Loading**: Component-specific loading states for better UX

### Modular Wallet System Architecture

The project implements a sophisticated modular wallet system that supports multiple wallet types through a unified interface:

#### Core Components

- **`src/types/wallet.ts`**: TypeScript interfaces defining wallet contracts
  - `WalletInterface`: Base interface for all wallet implementations
  - `WalletAccount`: Account information structure
  - `WalletCapabilities`: Feature support matrix
  - `WalletType`: Supported wallet types enumeration

- **`src/lib/wallets/base-wallet.ts`**: Abstract base class providing common functionality
  - Standard wallet operations (connect, disconnect, sign)
  - EIP-7702 authorization support
  - Smart account creation capabilities
  - User operation sending

- **`src/lib/wallets/wallet-manager.ts`**: Central coordination system
  - Multi-wallet initialization and management
  - Wallet switching and state management
  - Capability checking and delegation
  - React state change notifications

- **`src/hooks/useWalletManager.ts`**: React integration layer
  - Wallet state management in React components
  - Hook-based API for wallet operations
  - Automatic state synchronization

#### Wallet Implementations

- **`src/lib/wallets/local-key-wallet.ts`**: Environment-based private key wallet
  - Reads private keys from environment variables
  - Supports multiple key formats and indexing
  - Full EIP-7702 implementation with MetaMask Delegation Toolkit

- **`src/lib/wallets/injected-wallet.ts`**: Browser wallet integration
  - MetaMask and other injected wallet support
  - EIP-7702 with personal_sign fallback
  - Account change detection and handling

#### UI Components

- **`src/components/wallet/WalletSelector.tsx`**: Wallet selection interface
  - Available wallet detection and display
  - Key selection for local wallets
  - Connection status and switching

- **`src/components/wallet/WalletOperations.tsx`**: Wallet operation interface
  - Account information display
  - Transaction signing and sending
  - EIP-7702 authorization workflow

#### Key Features

- **Unified Interface**: All wallet types implement the same interface
- **Capability Detection**: Automatic feature support checking
- **Delegatee Filtering**: Smart contract support validation
- **Cross-Wallet Compatibility**: EIP-7702 works across all wallet types
- **Type Safety**: Full TypeScript support with strict typing

### Feature-Based Organization

The project uses a feature-based architecture:

- **`src/features/`**: Contains feature-specific code
- **`src/components/`**: Reusable UI components
- **`src/hooks/`**: Custom React hooks for business logic
- **`src/lib/`**: Third-party library configurations
- **`src/utils/`**: Shared utility functions
- **`src/types/`**: TypeScript type definitions

### Separation of Concerns

- **UI Components**: Handle presentation and user interaction
- **Custom Hooks**: Manage business logic and state
- **Utilities**: Provide shared functionality
- **Types**: Ensure type safety across the application

## 🔧 Configuration

### Centralized Configuration Management

The project uses a centralized configuration approach to prevent duplication:

#### Delegatee Contracts Configuration
- **`src/config/delegateeContracts.ts`**: Single source of truth for delegatee contract information
- **`src/config/eip7702.ts`**: Imports centralized configuration to avoid duplication
- **Benefits**: Consistent contract data across the application, easier maintenance

#### Configuration Structure
```typescript
// Centralized delegatee contracts (delegateeContracts.ts)
export const DELEGATEE_CONTRACTS: DelegateeContract[] = [
  {
    name: 'MetaMask deleGator Core',
    description: 'Core delegation contract for MetaMask',
    address: addresses.delegatee.metamask,
    requiresInjected: true
  },
  // ... more contracts
]

// EIP-7702 configuration imports centralized data (eip7702.ts)
import { DELEGATEE_CONTRACTS } from './delegateeContracts'
export const EIP7702_CONFIG = {
  // ... other config
  delegateeContracts: DELEGATEE_CONTRACTS,
}
```

### Network Configuration

Supported networks are configured in `src/config/`:

- **Sepolia Testnet**: Primary testing network
- **Mainnet**: Production deployment (when available)

### Feature Configuration

Each feature can be configured independently:

- **ZeroDev**: Configured via environment variables
- **MetaMask**: Uses MetaMask Delegation Toolkit defaults

### Wallet System Configuration

The Modular Wallet System is highly configurable:

#### Environment Variables
```env
# Private keys for local wallet
PRIVATE_KEYS="0x111... 0x222... 0x333..."
# OR
KEY0=0x111...
KEY1=0x222...
KEY2=0x333...

# ZeroDev configuration
ZERODEV_PROJECT_ID=your_project_id

# WalletConnect (optional)
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_id
```

#### Wallet Capabilities
Each wallet type supports different capabilities:

- **Local Private Key Wallet**:
  - ✅ EIP-7702 authorization signing
  - ✅ Smart account creation
  - ✅ User operation sending
  - ✅ Delegatee filtering
  - ✅ Transaction signing

- **Injected Wallet (MetaMask)**:
  - ✅ EIP-7702 authorization signing (with personal_sign)
  - ✅ EIP-712 typed data signing
  - ✅ Account change detection
  - ⚠️ Limited smart account features

- **Embedded Wallet (Coming Soon)**:
  - 🔄 Social login
  - 🔄 Gasless transactions
  - 🔄 Enhanced UX features

## 📚 Documentation

- **[EIP-7702 Guide](docs/guides/EIP7702_README.md)**: Detailed MetaMask implementation guide
- **[API Documentation](docs/api/)**: Technical API references
- **[Examples](docs/examples/)**: Code examples and tutorials

## 🎯 Advanced Features Benefits

### Loading State Management
- **Improved UX**: Skeleton loading provides better perceived performance
- **Granular Control**: Only affected UI sections show loading states
- **Non-Blocking**: Available actions remain interactive during operations
- **Context-Aware**: Different loading states for different operations
- **Consistent Experience**: Reusable skeleton components ensure consistency

### Configuration Management
- **DRY Principle**: No duplicate configuration across files
- **Single Source of Truth**: All contract data centralized
- **Easier Maintenance**: Changes only need to be made in one place
- **Type Safety**: Centralized type definitions prevent inconsistencies

### Modular Wallet System Benefits

#### For Developers
- **Unified Interface**: Single API for multiple wallet types
- **Type Safety**: Full TypeScript support with strict typing
- **Extensible**: Easy to add new wallet implementations
- **Capability Detection**: Automatic feature support checking
- **Cross-Wallet Compatibility**: EIP-7702 works across all wallet types

#### For Users
- **Flexibility**: Choose from multiple wallet options
- **Consistency**: Same experience across different wallet types
- **Security**: Environment-based private key management
- **Convenience**: Seamless wallet switching
- **Advanced Features**: EIP-7702 and smart account support

### Use Cases
- **Development**: Test with local private keys
- **Production**: Use MetaMask or other injected wallets
- **Enterprise**: Future embedded wallet integration
- **DApps**: Consistent wallet integration across applications

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Resources

- [EIP-7702 Specification](https://eips.ethereum.org/EIPS/eip-7702)
- [ZeroDev Documentation](https://docs.zerodev.app/)
- [MetaMask Delegation Toolkit](https://docs.metamask.io/delegation-toolkit/)
- [Viem Documentation](https://viem.sh/)
- [Wagmi Documentation](https://wagmi.sh/)

## 🆘 Support

For support and questions:

- Check the operation logs for detailed error information
- Review the documentation in the `docs/` directory
- Ensure you're connected to the correct network
- Verify your wallet has sufficient funds for gas fees
- Check loading states and skeleton UI for operation progress
