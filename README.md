# EIP-7702 Demo Project

A Next.js application demonstrating EIP-7702 smart account functionality using both ZeroDev and MetaMask Delegation Toolkit implementations. This project showcases how to upgrade Externally Owned Accounts (EOAs) to support smart account functionality.

## 🏗️ Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page (ZeroDev demo)
│   └── eip7702/           # EIP-7702 route
│       └── page.tsx       # MetaMask authorization page
├── components/            # Reusable UI components
│   ├── ui/               # Basic UI components
│   ├── layout/           # Layout components
│   │   └── Navigation.tsx
│   └── features/         # Feature-specific components
├── features/             # Feature modules
│   ├── eip7702/         # EIP-7702 MetaMask implementation
│   │   └── page.tsx
│   └── zerodev/         # ZeroDev implementation
│       └── page.tsx
├── lib/                  # Third-party library configurations
│   └── providers.tsx     # Wagmi providers
├── hooks/                # Custom React hooks
│   └── useEIP7702.ts     # EIP-7702 business logic
├── types/                # TypeScript type definitions
│   └── index.ts
├── utils/                # Utility functions
│   └── index.ts
├── config/               # Configuration files
│   ├── config.ts         # Wagmi configuration
│   └── eip7702.ts        # EIP-7702 settings
└── styles/               # Global styles
    └── globals.css

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

# Your private key for testing (REQUIRED for scripts)
PRIVATE_KEY=0xYourPrivateKeyHere

# Optional: WalletConnect Project ID
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id_here
```

**⚠️ Security Notes:**
- Never commit `.env.local` to version control
- Keep your ZeroDev Project ID private
- Use test accounts for development

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

### Web Interface

1. **Connect Wallet**: Use the Connect Wallet button
2. **Choose Implementation**:
   - **ZeroDev Demo**: Main page for ZeroDev EIP-7702
   - **MetaMask Authorization**: `/eip7702` for MetaMask Delegation Toolkit
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

### Network Configuration

Supported networks are configured in `src/config/`:

- **Sepolia Testnet**: Primary testing network
- **Mainnet**: Production deployment (when available)

### Feature Configuration

Each feature can be configured independently:

- **ZeroDev**: Configured via environment variables
- **MetaMask**: Uses MetaMask Delegation Toolkit defaults

## 📚 Documentation

- **[EIP-7702 Guide](docs/guides/EIP7702_README.md)**: Detailed MetaMask implementation guide
- **[API Documentation](docs/api/)**: Technical API references
- **[Examples](docs/examples/)**: Code examples and tutorials

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
