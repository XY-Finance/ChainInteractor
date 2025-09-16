/**
 * Get default value for a given Solidity type
 * @param type - The Solidity type string
 * @returns The default value for the type
 */
export const getDefaultValueForType = (type: string): any => {
  switch (type) {
    case 'address':
      return ''
    case 'uint256':
    case 'uint128':
    case 'uint64':
    case 'uint32':
    case 'uint16':
    case 'uint8':
    case 'int256':
    case 'int128':
    case 'int64':
    case 'int32':
    case 'int16':
    case 'int8':
      return 0n
    case 'bool':
      return false
    case 'string':
    case 'bytes':
    case 'bytes32':
    case 'bytes16':
    case 'bytes8':
    case 'bytes4':
    case 'bytes2':
    case 'bytes1':
      return ''
    case 'tuple':
      return {}
    default:
      return ''
  }
}

/**
 * Convert string input to appropriate type based on Solidity type
 * @param value - The string value to convert
 * @param type - The Solidity type string
 * @returns The converted value
 */
export const convertStringToType = (value: string, type: string): any => {
  const trimmedValue = value.trim()

  if (!trimmedValue) {
    return getDefaultValueForType(type)
  }

  switch (type) {
    case 'address':
      return trimmedValue
    case 'uint256':
    case 'uint128':
    case 'uint64':
    case 'uint32':
    case 'uint16':
    case 'uint8':
      return BigInt(trimmedValue)
    case 'int256':
    case 'int128':
    case 'int64':
    case 'int32':
    case 'int16':
    case 'int8':
      return BigInt(trimmedValue)
    case 'bool':
      return trimmedValue === 'true'
    case 'string':
    case 'bytes':
    case 'bytes32':
    case 'bytes16':
    case 'bytes8':
    case 'bytes4':
    case 'bytes2':
    case 'bytes1':
      return trimmedValue
    default:
      return trimmedValue
  }
}

/**
 * Custom JSON stringify that handles BigInt
 * @param value - The value to stringify
 * @returns JSON string with BigInt converted to string
 */
export const safeStringify = (value: any): string => {
  return JSON.stringify(value, (key, val) => {
    return typeof val === 'bigint' ? val.toString() : val
  })
}

/**
 * Convert value to string for display
 * @param value - The value to convert
 * @returns String representation of the value
 */
export const valueToString = (value: any): string => {
  if (value === undefined || value === null) return ''

  if (typeof value === 'boolean') {
    return value ? 'true' : 'false'
  }

  if (typeof value === 'bigint') {
    return value.toString()
  }

  if (Array.isArray(value)) {
    return safeStringify(value)
  }

  if (typeof value === 'object') {
    return safeStringify(value)
  }

  return String(value)
}

/**
 * Get placeholder text based on Solidity type
 * @param type - The Solidity type string
 * @returns Placeholder text for the input field
 */
export const getPlaceholderForType = (type: string): string => {
  switch (type) {
    case 'address':
      return '0x...'
    case 'uint256':
    case 'uint128':
    case 'uint64':
    case 'uint32':
    case 'uint16':
    case 'uint8':
    case 'int256':
    case 'int128':
    case 'int64':
    case 'int32':
    case 'int16':
    case 'int8':
      return '123'
    case 'bool':
      return 'true or false'
    case 'string':
      return 'Hello World'
    case 'bytes':
    case 'bytes32':
    case 'bytes16':
    case 'bytes8':
    case 'bytes4':
    case 'bytes2':
    case 'bytes1':
      return '0x...'
    case 'tuple':
      return 'Add components below'
    default:
      if (type.endsWith('[]')) {
        return 'Add elements below'
      }
      return 'Enter value'
  }
}

/**
 * Get type-specific validation hints
 * @param type - The Solidity type string
 * @returns Helpful hint text for the user
 */
export const getTypeHint = (type: string): string => {
  switch (type) {
    case 'address':
      return 'Enter a valid Ethereum address (0x followed by 40 hex characters)'
    case 'uint256':
    case 'uint128':
    case 'uint64':
    case 'uint32':
    case 'uint16':
    case 'uint8':
      return 'Enter a positive integer'
    case 'int256':
    case 'int128':
    case 'int64':
    case 'int32':
    case 'int16':
    case 'int8':
      return 'Enter an integer (positive or negative)'
    case 'bool':
      return 'Enter "true" or "false"'
    case 'string':
      return 'Enter any text string'
    case 'bytes':
    case 'bytes32':
    case 'bytes16':
    case 'bytes8':
    case 'bytes4':
    case 'bytes2':
    case 'bytes1':
      return 'Enter hex data (0x followed by hex characters)'
    case 'tuple':
      return 'Add components to define the tuple structure'
    default:
      if (type.endsWith('[]')) {
        return 'Add elements to define the array structure'
      }
      return ''
  }
}

/**
 * Validate function name format
 * @param name - The function name to validate
 * @returns Validation result with isValid flag and message
 */
export const validateFunctionName = (name: string): { isValid: boolean; message: string } => {
  if (!name.trim()) {
    return { isValid: false, message: 'Function name is required' }
  }
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name)) {
    return { isValid: false, message: 'Invalid function name format' }
  }
  return { isValid: true, message: '' }
}

/**
 * Validate Ethereum address format
 * @param address - The address to validate
 * @param isAddress - Function to validate address (from viem/ethers)
 * @returns Validation result with isValid flag and message
 */
export const validateAddress = (address: string, isAddress: (address: string) => boolean): { isValid: boolean; message: string } => {
  if (!address.trim()) {
    return { isValid: false, message: 'Contract address is required' }
  }
  if (!isAddress(address)) {
    return { isValid: false, message: 'Invalid Ethereum address format' }
  }
  return { isValid: true, message: '' }
}

/**
 * Validate data value based on Solidity type
 * @param input - The ABI input definition
 * @param value - The value to validate
 * @param isAddress - Function to validate address (from viem/ethers)
 * @returns Validation result with isValid flag and message
 */
export const validateDataValue = (input: any, value: any, isAddress: (address: string) => boolean): { isValid: boolean; message: string } => {
  if (value === undefined || value === null || value === '') {
    return { isValid: false, message: 'Value is required' }
  }

  const stringValue = String(value).trim()

  switch (input.type) {
    case 'address':
      if (!isAddress(stringValue)) {
        return { isValid: false, message: 'Invalid address format' }
      }
      break
    case 'uint256':
    case 'uint128':
    case 'uint64':
    case 'uint32':
    case 'uint16':
    case 'uint8':
      if (!/^\d+$/.test(stringValue) || BigInt(stringValue) < 0n) {
        return { isValid: false, message: 'Must be a positive integer' }
      }
      break
    case 'int256':
    case 'int128':
    case 'int64':
    case 'int32':
    case 'int16':
    case 'int8':
      if (!/^-?\d+$/.test(stringValue)) {
        return { isValid: false, message: 'Must be an integer' }
      }
      break
    case 'bool':
      if (!['true', 'false'].includes(stringValue.toLowerCase())) {
        return { isValid: false, message: 'Must be "true" or "false"' }
      }
      break
    case 'bytes':
    case 'bytes32':
    case 'bytes16':
    case 'bytes8':
    case 'bytes4':
    case 'bytes2':
    case 'bytes1':
      if (!/^0x[0-9a-fA-F]*$/.test(stringValue)) {
        return { isValid: false, message: 'Must be hex format (0x...)' }
      }
      break
    case 'string':
      if (!stringValue) {
        return { isValid: false, message: 'String value is required' }
      }
      break
    default:
      if (input.type.endsWith('[]') || input.type === 'tuple') {
        // For arrays and tuples, just check if value exists
        if (!value) {
          return { isValid: false, message: 'Value is required' }
        }
      } else if (!stringValue) {
        return { isValid: false, message: 'Value is required' }
      }
      break
  }

  return { isValid: true, message: '' }
}

/**
 * Save recent value to localStorage for a specific type
 * @param type - The Solidity type
 * @param value - The value to save
 */
export const saveRecentValue = (type: string, value: string) => {
  const key = `recent_${type}`
  const recent = JSON.parse(localStorage.getItem(key) || '[]')
  const updated = [value, ...recent.filter((v: string) => v !== value)].slice(0, 20)
  localStorage.setItem(key, JSON.stringify(updated))
}

/**
 * Get recent values from localStorage for a specific type
 * @param type - The Solidity type
 * @returns Array of recent values
 */
export const getRecentValues = (type: string): string[] => {
  const key = `recent_${type}`
  return JSON.parse(localStorage.getItem(key) || '[]')
}

// ============================================================================
// ADDRESS UTILITIES
// ============================================================================

/**
 * Save recent address to localStorage
 * @param address - The address to save
 * @param isAddress - Function to validate address (from viem/ethers)
 */
export const saveRecentAddress = (address: string, isAddress: (address: string) => boolean) => {
  // Only save valid Ethereum addresses to localStorage
  if (!isAddress(address)) {
    console.warn('Attempted to save invalid address to localStorage:', address)
    return
  }

  const key = 'recent_addresses'
  const recent = JSON.parse(localStorage.getItem(key) || '[]')
  const updated = [address, ...recent.filter((v: string) => v !== address)].slice(0, 5)
  localStorage.setItem(key, JSON.stringify(updated))
}

/**
 * Get recent addresses from localStorage
 * @param isAddress - Function to validate address (from viem/ethers)
 * @returns Array of valid recent addresses
 */
export const getRecentAddresses = (isAddress: (address: string) => boolean): string[] => {
  const key = 'recent_addresses'
  const addresses = JSON.parse(localStorage.getItem(key) || '[]')
  // Filter out any invalid addresses that might exist in localStorage
  return addresses.filter((addr: string) => isAddress(addr))
}

/**
 * Validate recipient address (not zero address)
 * @param address - The address to validate
 * @param isAddress - Function to validate address (from viem/ethers)
 * @returns True if address is valid and not zero address
 */
export const validateRecipientAddress = (address: string, isAddress: (address: string) => boolean): boolean => {
  return isAddress(address) && address !== '0x0000000000000000000000000000000000000000'
}
