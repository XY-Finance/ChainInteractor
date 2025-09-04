# Transaction Builder

A dynamic transaction builder that allows users to create and execute any smart contract function call.

## Features

- **Dynamic Function Input**: Enter any function name and parameters
- **Parameter Management**: Add, remove, and configure function parameters with proper Solidity types
- **Real-time Encoding**: Encode function calls using ABI encoding
- **Transaction Execution**: Send transactions directly to the blockchain
- **Example Templates**: Pre-built examples for common transaction types
- **Transaction Preview**: Review encoded data and transaction status

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

### 3. Transaction Execution
- **Encode Data**: Generates the ABI-encoded function call
- **Send Transaction**: Executes the transaction on the blockchain

## Example Transactions

The builder includes pre-built examples for common use cases:

- **ERC20 Transfer**: Transfer tokens to another address
- **ERC20 Approve**: Approve another address to spend tokens
- **ERC721 Transfer**: Transfer an NFT
- **Simple Storage**: Set a value in a storage contract

## Technical Details

- Uses Viem for ABI encoding and transaction handling
- Supports all standard Solidity types
- Validates Ethereum addresses and parameter formats
- Integrates with the existing wallet management system
- Provides real-time feedback and error handling

## Components

- `TransactionBuilder.tsx` - Main component with form and logic
- `ParameterInput.tsx` - Individual parameter input fields
- `TransactionPreview.tsx` - Display encoded data and transaction status
- `ExampleTransactions.tsx` - Pre-built transaction examples

## Error Handling

- Validates function names and parameters
- Checks Ethereum address format
- Ensures all required fields are filled
- Provides clear error messages in the operation logs
