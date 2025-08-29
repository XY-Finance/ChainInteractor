'use client'

import React from 'react'
import { Button } from '../../../components/ui/Button'
import type { Parameter } from './TransactionBuilder'

interface ParameterInputProps {
  parameter: Parameter
  onUpdate: (field: keyof Parameter, value: string) => void
  onRemove: () => void
}

const SOLIDITY_TYPES = [
  'address',
  'uint256',
  'uint128',
  'uint64',
  'uint32',
  'uint16',
  'uint8',
  'int256',
  'int128',
  'int64',
  'int32',
  'int16',
  'int8',
  'bool',
  'string',
  'bytes',
  'bytes32',
  'bytes16',
  'bytes8',
  'bytes4',
  'bytes2',
  'bytes1'
]

const ParameterInput = React.memo(function ParameterInput({
  parameter,
  onUpdate,
  onRemove
}: ParameterInputProps) {
  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
        {/* Parameter Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Parameter Name
          </label>
          <input
            type="text"
            value={parameter.name}
            onChange={(e) => onUpdate('name', e.target.value)}
            placeholder="e.g., to, amount, tokenId"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />
        </div>

        {/* Parameter Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Type
          </label>
          <select
            value={parameter.type}
            onChange={(e) => onUpdate('type', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          >
            {SOLIDITY_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        {/* Parameter Value */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Value
          </label>
          <input
            type="text"
            value={parameter.value}
            onChange={(e) => onUpdate('value', e.target.value)}
            placeholder={getPlaceholderForType(parameter.type)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />
        </div>

        {/* Remove Button */}
        <div>
          <Button
            onClick={onRemove}
            variant="danger"
            size="sm"
            className="w-full"
          >
            🗑️ Remove
          </Button>
        </div>
      </div>

      {/* Type-specific hints */}
      <div className="mt-2 text-xs text-gray-500">
        {getTypeHint(parameter.type)}
      </div>
    </div>
  )
})

// Helper function to get placeholder text based on type
function getPlaceholderForType(type: string): string {
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
    default:
      return 'Enter value'
  }
}

// Helper function to get type-specific hints
function getTypeHint(type: string): string {
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
    default:
      return ''
  }
}

export default ParameterInput
