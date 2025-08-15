import { type Address } from 'viem'

// Address validation and formatting
export function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address)
}

export function formatAddress(address: string, length: number = 8): string {
  if (!isValidAddress(address)) return address
  return `${address.slice(0, length + 2)}...${address.slice(-length)}`
}

// Logging utilities
export function createLogEntry(message: string, type: 'info' | 'success' | 'error' | 'warning' = 'info') {
  return {
    timestamp: new Date().toLocaleTimeString(),
    message,
    type
  }
}

// Error handling
export function handleError(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  return String(error)
}

// Network utilities
export function getExplorerUrl(chainId: number, hash: string): string {
  const explorers: Record<number, string> = {
    11155111: 'https://sepolia.etherscan.io', // Sepolia
    1: 'https://etherscan.io', // Mainnet
  }

  const baseUrl = explorers[chainId] || explorers[11155111]
  return `${baseUrl}/tx/${hash}`
}

// Validation utilities
export function validateAmount(amount: string): boolean {
  const num = parseFloat(amount)
  return !isNaN(num) && num > 0
}

export function validateRecipientAddress(address: string): boolean {
  return isValidAddress(address) && address !== '0x0000000000000000000000000000000000000000'
}
