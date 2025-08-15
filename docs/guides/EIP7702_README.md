# EIP-7702 Authorization Dashboard

This project demonstrates EIP-7702 authorization using the MetaMask Delegation Toolkit, allowing users to upgrade their Externally Owned Accounts (EOAs) to support MetaMask Smart Accounts functionality.

## Features

- **EIP-7702 Authorization**: Authorize your EOA to use delegatee contracts
- **MetaMask deleGator Core Support**: Integration with MetaMask's core delegation contracts
- **Smart Account Creation**: Create MetaMask Smart Account instances
- **User Operations**: Send user operations through upgraded EOAs
- **Real-time Logging**: Comprehensive operation logs for debugging
- **Modern UI**: Beautiful, responsive interface with Tailwind CSS

## How It Works

### 1. EIP-7702 Overview

EIP-7702 enables your externally owned account (EOA) to support MetaMask Smart Accounts functionality using an EIP-7702 transaction. This allows your EOA to leverage the benefits of account abstraction, such as:

- Batch transactions
- Gas sponsorship
- ERC-7710 delegation capabilities
- Enhanced security features

### 2. Authorization Process

The authorization process follows these steps:

1. **Select Delegatee Contract**: Choose from available delegatee contracts (e.g., MetaMask deleGator Core)
2. **Sign Authorization**: Create and sign an EIP-7702 authorization
3. **Submit Transaction**: Submit the authorization to the blockchain
4. **Create Smart Account**: Instantiate a MetaMask Smart Account
5. **Send User Operations**: Execute transactions through the upgraded account

### 3. Technical Implementation

The implementation uses the MetaMask Delegation Toolkit and follows the official documentation:

```typescript
// Authorize 7702 delegation
const authorization = await walletClient.signAuthorization({
  account: address,
  contractAddress: selectedContract.address,
  executor: 'self',
});

// Submit authorization
const hash = await walletClient.sendTransaction({
  authorizationList: [authorization],
  data: '0x',
  to: zeroAddress,
});

// Create smart account
const smartAccount = await toMetaMaskSmartAccount({
  client: publicClient,
  implementation: Implementation.Stateless7702,
  address,
  signatory: { walletClient },
});
```

## Getting Started

### Prerequisites

- Node.js 18+
- MetaMask wallet
- Sepolia testnet ETH

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Usage

1. **Connect Wallet**: Click "Connect Wallet" and connect your MetaMask wallet
2. **Select Contract**: Choose a delegatee contract from the available options
3. **Authorize**: Click "Authorize 7702" to sign the authorization
4. **Submit**: Click "Submit Authorization" to broadcast the transaction
5. **Create Smart Account**: Create a MetaMask Smart Account instance
6. **Send User Operation**: Execute transactions through your upgraded account

## Supported Networks

- **Sepolia Testnet**: Primary testing network
- **Mainnet**: Production deployment (when available)

## Delegatee Contracts

### MetaMask deleGator Core

- **Address**: Dynamically resolved from MetaMask Delegation Toolkit
- **Implementation**: `EIP7702StatelessDeleGatorImpl`
- **Description**: Core MetaMask deleGator implementation for EIP-7702

### Custom EIP-7702 Delegator

- **Address**: Configurable
- **Implementation**: `Implementation.Stateless7702`
- **Description**: Custom implementation for EIP-7702 delegation

## Architecture

### Frontend Components

- **Navigation**: Page navigation between ZeroDev and MetaMask demos
- **EIP7702Page**: Main authorization dashboard
- **ConnectButton**: Wallet connection interface
- **Operation Logs**: Real-time operation tracking

### Key Dependencies

- **@metamask/delegation-toolkit**: MetaMask Delegation Toolkit
- **viem**: Ethereum client library
- **wagmi**: React hooks for Ethereum
- **@rainbow-me/rainbowkit**: Wallet connection UI
- **Next.js**: React framework

### State Management

The application uses React hooks for state management:

- `useState`: Local component state
- `useEffect`: Side effects and initialization
- `useAccount`: Wallet connection state
- `usePublicClient`: Blockchain client
- `useWalletClient`: Wallet operations

## Error Handling

The application includes comprehensive error handling:

- **Network Errors**: Graceful handling of RPC failures
- **User Rejections**: Proper handling of user transaction rejections
- **Validation**: Input validation and parameter checking
- **Logging**: Detailed operation logs for debugging

## Security Considerations

- **Private Key Security**: Never expose private keys in the frontend
- **Transaction Validation**: Validate all transaction parameters
- **Network Verification**: Ensure correct network selection
- **Authorization Limits**: Implement appropriate authorization restrictions

## Development

### Project Structure

```
src/
├── app/
│   ├── components/
│   │   └── Navigation.tsx
│   ├── eip7702/
│   │   └── page.tsx
│   ├── layout.tsx
│   ├── page.tsx
│   └── providers.tsx
├── globals.css
└── ...
```

### Available Scripts

- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run start`: Start production server
- `npm run lint`: Run ESLint

### Environment Variables

Create a `.env.local` file with:

```env
NEXT_PUBLIC_ZERODEV_PROJECT_ID=your_project_id
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Resources

- [MetaMask Delegation Toolkit Documentation](https://docs.metamask.io/delegation-toolkit/)
- [EIP-7702 Specification](https://eips.ethereum.org/EIPS/eip-7702)
- [Viem Documentation](https://viem.sh/)
- [Wagmi Documentation](https://wagmi.sh/)

## Support

For support and questions:

- Check the operation logs for detailed error information
- Review the MetaMask Delegation Toolkit documentation
- Ensure you're connected to the correct network
- Verify your wallet has sufficient funds for gas fees
