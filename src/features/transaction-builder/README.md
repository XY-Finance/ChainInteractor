# Transaction Builder

A dynamic transaction builder that allows users to create and execute any smart contract function call using proper ABI structure.

## Features

- **ABI-Based Architecture**: Uses direct ABI structure for `viem.encodeFunctionData` compatibility
- **Dynamic Function Input**: Enter any function name and parameters
- **Parameter Management**: Add, remove, and configure function parameters with proper Solidity types
- **Real-time Encoding**: Encode function calls using ABI encoding with sync state tracking
- **Transaction Execution**: Send transactions directly to the blockchain
- **Eth Call Support**: Test function calls without sending transactions
- **Example Templates**: Pre-built examples for common transaction types including ERC-4337 EntryPoint
- **Auto-sync Management**: Encoded data shows "Out of Sync" when parameters change

## Usage

### 1. Function Configuration
- Enter the function name (e.g., `transfer`, `approve`, `mint`)
- Specify the target contract address

### 2. Parameter Setup
- Add parameters with names, types, and values
- Supported Solidity types:
  - `address` - Ethereum addresses
  - `uint256`, `uint128`, `uint64`, `uint32`, `uint16`, `uint8` - Unsigned integers
  - `int256`, `int128`, `int64`, `int32`, `int16`, `int8` - Signed integers
  - `bool` - Boolean values
  - `string` - Text strings
  - `bytes`, `bytes32`, `bytes16`, `bytes8`, `bytes4`, `bytes2`, `bytes1` - Byte arrays
  - `tuple` - Structured data types
  - `[]` - Array types (e.g., `address[]`, `uint256[]`)

### 3. Transaction Execution
- **Encode Data**: Generates the ABI-encoded function call
- **Eth Call**: Test the function call without sending a transaction
- **Send Transaction**: Executes the transaction on the blockchain

## Example Transactions

The builder includes pre-built examples for common use cases:

- **ERC-2612 Permit**: Gasless token approvals
- **USDC Transfer**: Transfer USDC tokens
- **USDC Approve**: Approve token spending
- **USDC Balance Check**: View token balances
- **Multicall Aggregate**: Execute multiple calls in one transaction
- **Install ECDSA Signer Module**: Smart account module installation
- **EntryPoint handleOps (ERC-4337)**: Account abstraction operations

## Technical Details

- Uses Viem for ABI encoding and transaction handling
- Supports all standard Solidity types including complex nested structures
- Validates Ethereum addresses and parameter formats
- Integrates with the existing wallet management system
- Provides real-time feedback and error handling
- Automatic sync state management for encoded data
- Recent values storage for improved UX

## Components

- `TransactionBuilder.tsx` - Main component with form and logic
- `ParameterInput.tsx` - Individual parameter input fields with recursive rendering
- `ExampleTransactions.tsx` - Pre-built transaction examples

## Error Handling

- Validates function names and parameters
- Checks Ethereum address format
- Ensures all required fields are filled
- Provides clear error messages and type hints
- Shows validation state in real-time
