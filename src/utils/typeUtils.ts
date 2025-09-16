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
