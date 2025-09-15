'use client'

import React, { useState, useEffect, useRef } from 'react'
import { AddressSelector } from '../../../components/ui'
import TypeSelector from '../../../components/ui/TypeSelector'
import { isAddress } from 'viem'

interface AbiInput {
  name: string
  type: string
  components?: AbiInput[]
}

interface ParameterInputProps {
  abiInput: AbiInput
  dataValue: any
  validation?: { isValid: boolean; message: string }
  onUpdate: (newValue: any) => void
  onRemove?: () => void
  onUpdateName?: (newName: string) => void
  onUpdateType?: (newType: string) => void
  onAddComponent?: () => void
  annotation?: string
  index?: number
  disabled?: boolean
}

// localStorage utilities for recent values
const saveRecentValue = (type: string, value: string) => {
  const key = `recent_${type}`
  const recent = JSON.parse(localStorage.getItem(key) || '[]')
  const updated = [value, ...recent.filter((v: string) => v !== value)].slice(0, 20)
  localStorage.setItem(key, JSON.stringify(updated))
}

const getRecentValues = (type: string): string[] => {
  const key = `recent_${type}`
  return JSON.parse(localStorage.getItem(key) || '[]')
}

// Helper functions for type manipulation
const getBaseType = (type: string): string => {
  // Remove all [] suffixes to get the base type
  return type.replace(/\[\]+$/, '')
}

const getArraySuffix = (type: string): string => {
  // Extract all [] suffixes
  const matches = type.match(/\[\]+$/)
  return matches ? matches[0] : ''
}

const getArrayDimension = (type: string): number => {
  // Count the number of [] pairs at the end
  const matches = type.match(/\[\]+$/)
  if (!matches) return 0
  return matches[0].length / 2
}

const setArrayDimension = (baseType: string, dimension: number): string => {
  // Create type with specified number of [] dimensions
  return baseType + '[]'.repeat(dimension)
}



// Helper functions to generate annotations
const generateArrayAnnotation = (parentAnnotation: string, index: number): string => {
  if (parentAnnotation === "1") {
    return `[${index}]`
  } else {
    return `${parentAnnotation}[${index}]`
  }
}

const generateTupleAnnotation = (parentAnnotation: string, index: number, isLast: boolean): string => {
  if (parentAnnotation === "1") {
    return "+-·"
  } else {
    const shouldSlice = parentAnnotation.endsWith('·');
    const parentLines = (shouldSlice ? parentAnnotation.slice(0, -1) : parentAnnotation)
      .replace(/\+/g, '|')
      .replace(/-/g, ' ');
    const connector = "+-·"
    return parentLines + connector
  }
}

const ParameterInput = React.memo(function ParameterInput({
  abiInput,
  dataValue,
  validation,
  onUpdate,
  onRemove,
  onUpdateName,
  onUpdateType,
  onAddComponent,
  annotation = "1",
  index = 0,
  disabled = false
}: ParameterInputProps) {
  const isInvalid = validation && !validation.isValid && dataValue !== undefined && dataValue !== null && dataValue !== ''

  // Dropdown state
  const [isValueDropdownOpen, setIsValueDropdownOpen] = useState(false)
  const [filteredValueSuggestions, setFilteredValueSuggestions] = useState<string[]>([])

  // Refs for dropdown positioning
  const valueInputRef = useRef<HTMLInputElement>(null)
  const valueDropdownRef = useRef<HTMLDivElement>(null)

  // Get recent values for current parameter type
  const recentValues = getRecentValues(abiInput.type)

  // Filter suggestions based on current input
  const filterSuggestions = (input: string, suggestions: string[]) => {
    if (!input.trim()) return suggestions
    return suggestions.filter(s =>
      s.toLowerCase().includes(input.toLowerCase())
    )
  }

  // Handle value input changes
  const handleValueChange = (value: string) => {
    // Convert string value to appropriate type based on ABI input type
    const convertedValue = convertStringToType(value, abiInput.type)
    onUpdate(convertedValue)

    const filtered = filterSuggestions(value, recentValues)
    setFilteredValueSuggestions(filtered)
    setIsValueDropdownOpen(filtered.length > 0 && value.trim() !== '')
  }

  // Handle value selection from dropdown
  const handleValueSelect = (selectedValue: string) => {
    const convertedValue = convertStringToType(selectedValue, abiInput.type)
    onUpdate(convertedValue)
    setIsValueDropdownOpen(false)
    valueInputRef.current?.blur()
  }

  // Convert string input to appropriate type
  const convertStringToType = (value: string, type: string): any => {
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

  // Get default value for type
  const getDefaultValueForType = (type: string): any => {
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
      default:
        return ''
    }
  }

  // Custom JSON stringify that handles BigInt
  const safeStringify = (value: any): string => {
    return JSON.stringify(value, (key, val) => {
      return typeof val === 'bigint' ? val.toString() : val
    })
  }

  // Convert value to string for display
  const valueToString = (value: any): string => {
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

  // Save recent values when parameter is valid
  useEffect(() => {
    if (validation?.isValid && dataValue !== undefined && dataValue !== null && dataValue !== '') {
      const stringValue = valueToString(dataValue)
      if (stringValue.trim()) {
        saveRecentValue(abiInput.type, stringValue.trim())
      }
    }
  }, [validation?.isValid, dataValue, abiInput.type])

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (valueDropdownRef.current && !valueDropdownRef.current.contains(event.target as Node)) {
        setIsValueDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Handle array operations
  const handleArrayAdd = () => {
    if (Array.isArray(dataValue)) {
      const newArray = [...dataValue, getDefaultValueForType(abiInput.type.slice(0, -2))]
      onUpdate(newArray)
    } else {
      onUpdate([getDefaultValueForType(abiInput.type.slice(0, -2))])
    }
  }

  const handleArrayRemove = (index: number) => {
    if (Array.isArray(dataValue)) {
      const newArray = dataValue.filter((_, i) => i !== index)
      onUpdate(newArray)
    }
  }

  const handleArrayUpdate = (index: number, newValue: any) => {
    if (Array.isArray(dataValue)) {
      const newArray = [...dataValue]
      newArray[index] = newValue
      onUpdate(newArray)
    }
  }

  // Handle tuple operations
  const handleTupleAdd = () => {
    if (abiInput.components) {
      const newTuple: any = {}
      abiInput.components.forEach(comp => {
        newTuple[comp.name] = getDefaultValueForType(comp.type)
      })
      onUpdate(newTuple)
    }
  }

  const handleTupleUpdate = (componentName: string, newValue: any) => {
    if (typeof dataValue === 'object' && dataValue !== null) {
      const newTuple = { ...dataValue }
      newTuple[componentName] = newValue
      onUpdate(newTuple)
    }
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
        {/* Annotation Column */}
        <div className="md:col-span-1">
          <div className="text-xs text-gray-500 font-mono text-left">
            {annotation}
          </div>
        </div>

        {/* Parameter Name */}
        <div className="md:col-span-2">
          <input
            type="text"
            value={abiInput.name}
            onChange={(e) => onUpdateName?.(e.target.value)}
            placeholder="Parameter name"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:border-transparent focus:ring-blue-500 text-sm"
          />
        </div>

        {/* Parameter Type */}
        <div className="md:col-span-2">
          <TypeSelector
            value={abiInput.type}
            onChange={onUpdateType || (() => {})}
            placeholder="Select type..."
            className="text-sm"
            disabled={disabled}
          />
        </div>

        {/* Parameter Value */}
        <div className="relative md:col-span-6">
          {abiInput.type === 'bool' ? (
            <div className="flex items-center justify-center h-10">
              <button
                type="button"
                onClick={() => onUpdate(!dataValue)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  dataValue
                    ? 'bg-blue-600 focus:ring-blue-500'
                    : 'bg-gray-200 focus:ring-gray-500'
                } ${isInvalid ? 'ring-2 ring-red-500' : ''}`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    dataValue ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
              <span className="ml-3 text-sm font-medium text-gray-700">
                {dataValue ? 'true' : 'false'}
              </span>
            </div>
          ) : abiInput.type === 'tuple' ? (
            <div className="flex items-center justify-center h-10">
              <button
                onClick={handleTupleAdd}
                className="text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-3 py-2 rounded transition-colors border border-blue-200"
              >
                ➕ Add Tuple
              </button>
            </div>
          ) : abiInput.type.endsWith('[]') ? (
            <div className="flex items-center justify-center h-10">
              <button
                onClick={handleArrayAdd}
                className="text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-3 py-2 rounded transition-colors border border-blue-200"
              >
                ➕ Add Element
              </button>
            </div>
          ) : abiInput.type === 'address' ? (
            <AddressSelector
              value={valueToString(dataValue)}
              onChange={handleValueChange}
              placeholder="Select address..."
              className={isInvalid ? 'border-red-300 focus:ring-red-500' : ''}
            />
          ) : (
            <>
              <input
                ref={valueInputRef}
                type="text"
                value={valueToString(dataValue)}
                onChange={(e) => handleValueChange(e.target.value)}
                onFocus={() => {
                  const filtered = filterSuggestions(valueToString(dataValue), recentValues)
                  setFilteredValueSuggestions(filtered)
                  setIsValueDropdownOpen(filtered.length > 0)
                }}
                placeholder={getPlaceholderForType(abiInput.type)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:border-transparent text-sm ${
                  isInvalid
                    ? 'border-red-300 focus:ring-red-500'
                    : 'border-gray-300 focus:ring-blue-500'
                }`}
              />
              {/* Value Dropdown */}
              {isValueDropdownOpen && filteredValueSuggestions.length > 0 && (
                <div
                  ref={valueDropdownRef}
                  className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-40 overflow-y-auto"
                >
                  {filteredValueSuggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                      onClick={() => handleValueSelect(suggestion)}
                    >
                      {suggestion}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Remove Button */}
        {onRemove && (
          <div className="md:col-span-1 flex justify-center items-center">
            <button
              onClick={onRemove}
              className="w-8 h-8 text-white bg-red-500 hover:bg-red-600 rounded-md transition-colors flex items-center justify-center text-lg font-bold"
              title="Remove parameter"
            >
              ×
            </button>
          </div>
        )}
      </div>

      {/* Error message - only show when input is invalid */}
      {isInvalid && (
        <div className="mt-2 text-xs text-red-600">
          {validation?.message}
        </div>
      )}

      {/* Type-specific hints - only show when input is invalid */}
      {isInvalid && (
        <div className="mt-1 text-xs text-gray-500">
          {getTypeHint(abiInput.type)}
        </div>
      )}

      {/* Recursive rendering for arrays */}
      {abiInput.type.endsWith('[]') && Array.isArray(dataValue) && dataValue.length > 0 && (
        <div className="mt-4 space-y-2">
          {dataValue.map((item, index) => {
            const elementType = abiInput.type.slice(0, -2)
            const elementAbiInput: AbiInput = {
              name: `element_${index}`,
              type: elementType,
              components: abiInput.components
            }

            const elementAnnotation = generateArrayAnnotation(annotation, index + 1)

            return (
              <div key={index} className="ml-2 border-l-2 border-gray-200 pl-2">
                <ParameterInput
                  abiInput={elementAbiInput}
                  dataValue={item}
                  validation={validation}
                  onUpdate={(newValue) => handleArrayUpdate(index, newValue)}
                  onRemove={() => handleArrayRemove(index)}
                  annotation={elementAnnotation}
                  index={index}
                  disabled={true}
                />
              </div>
            )
          })}
        </div>
      )}

      {/* Recursive rendering for tuples */}
      {abiInput.type === 'tuple' && abiInput.components && typeof dataValue === 'object' && dataValue !== null && (
        <div className="mt-4 space-y-2">
          {abiInput.components.map((component, index) => {
            const isLast = index === abiInput.components!.length - 1
            const componentAnnotation = generateTupleAnnotation(annotation, index + 1, isLast)
            const componentValue = dataValue[component.name]

            return (
              <div key={component.name} className="ml-2 border-l-2 border-gray-200 pl-2">
                <ParameterInput
                  abiInput={component}
                  dataValue={componentValue}
                  validation={validation}
                  onUpdate={(newValue) => handleTupleUpdate(component.name, newValue)}
                  annotation={componentAnnotation}
                  index={index}
                  disabled={true}
                />
              </div>
            )
          })}
        </div>
      )}
    </>
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
    case 'tuple':
      return 'Add components below'
    default:
      if (type.endsWith('[]')) {
        return 'Add elements below'
      }
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
    case 'tuple':
      return 'Add components to define the tuple structure'
    default:
      if (type.endsWith('[]')) {
        return 'Add elements to define the array structure'
      }
      return ''
  }
}

export default ParameterInput

