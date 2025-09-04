'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Button } from '../../../components/ui/Button'
import { AddressSelector } from '../../../components/ui'
import type { Parameter } from './TransactionBuilder'

interface ParameterInputProps {
  parameter: Parameter
  validation?: { isValid: boolean; message: string }
  onUpdate: (field: keyof Parameter, value: string) => void
  onRemove: () => void
  onAddTupleComponent?: () => void
  depth?: number
  parentId?: string
  isTupleComponent?: boolean
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
  'bytes1',
  'tuple'
]

const ParameterInput = React.memo(function ParameterInput({
  parameter,
  validation,
  onUpdate,
  onRemove,
  onAddTupleComponent,
  depth = 0,
  parentId,
  isTupleComponent = false
}: ParameterInputProps) {
  const isInvalid = validation && !validation.isValid && parameter.value.trim()

  // Dropdown state
  const [isNameDropdownOpen, setIsNameDropdownOpen] = useState(false)
  const [isValueDropdownOpen, setIsValueDropdownOpen] = useState(false)
  const [filteredNameSuggestions, setFilteredNameSuggestions] = useState<string[]>([])
  const [filteredValueSuggestions, setFilteredValueSuggestions] = useState<string[]>([])

  // Refs for dropdown positioning
  const nameInputRef = useRef<HTMLInputElement>(null)
  const valueInputRef = useRef<HTMLInputElement>(null)
  const nameDropdownRef = useRef<HTMLDivElement>(null)
  const valueDropdownRef = useRef<HTMLDivElement>(null)

  // Get recent values for current parameter type
  const recentValues = getRecentValues(parameter.type)
  const recentNames = getRecentValues('parameter_names')

  // Filter suggestions based on current input
  const filterSuggestions = (input: string, suggestions: string[]) => {
    if (!input.trim()) return suggestions
    return suggestions.filter(s =>
      s.toLowerCase().includes(input.toLowerCase())
    )
  }

  // Handle name input changes
  const handleNameChange = (value: string) => {
    onUpdate('name', value)
    const filtered = filterSuggestions(value, recentNames)
    setFilteredNameSuggestions(filtered)
    setIsNameDropdownOpen(filtered.length > 0 && value.trim() !== '')
  }

  // Handle value input changes
  const handleValueChange = (value: string) => {
    onUpdate('value', value)
    const filtered = filterSuggestions(value, recentValues)
    setFilteredValueSuggestions(filtered)
    setIsValueDropdownOpen(filtered.length > 0 && value.trim() !== '')
  }

  // Handle name selection from dropdown
  const handleNameSelect = (selectedName: string) => {
    onUpdate('name', selectedName)
    setIsNameDropdownOpen(false)
    nameInputRef.current?.blur()
  }

  // Handle value selection from dropdown
  const handleValueSelect = (selectedValue: string) => {
    onUpdate('value', selectedValue)
    setIsValueDropdownOpen(false)
    valueInputRef.current?.blur()
  }

      // Handle tuple component updates
  const handleTupleComponentUpdate = (componentId: string, field: keyof Parameter, value: string) => {
    const currentComponents = parameter.components || []

    const updatedComponents = currentComponents.map(comp =>
      comp.id === componentId ? { ...comp, [field]: value } : comp
    )

    // Reconstruct the tuple value from components
    const tupleValue: any = {}
    updatedComponents.forEach(comp => {
      if (comp.name.trim()) {
        tupleValue[comp.name] = comp.value
      }
    })

    onUpdate('value', JSON.stringify(tupleValue))
  }



    // Add tuple component
  const addTupleComponent = () => {
    const newComponent: Parameter = {
      id: Date.now().toString() + Math.random(),
      name: '',
      type: 'address',
      value: ''
    }

    const currentComponents = parameter.components || []
    const updatedComponents = [...currentComponents, newComponent]
    onUpdate('components', JSON.stringify(updatedComponents))
  }

    // Remove tuple component
  const removeTupleComponent = (componentId: string) => {
    const currentComponents = parameter.components || []
    const updatedComponents = currentComponents.filter(comp => comp.id !== componentId)
    onUpdate('components', JSON.stringify(updatedComponents))
  }

  // Handle nested tuple component updates
  const handleNestedTupleComponentUpdate = (parentComponentId: string, nestedComponentId: string, field: keyof Parameter, value: string) => {
    const currentComponents = parameter.components || []

    const updatedComponents = currentComponents.map(comp => {
      if (comp.id === parentComponentId && comp.components) {
        const updatedNestedComponents = comp.components.map(nestedComp =>
          nestedComp.id === nestedComponentId ? { ...nestedComp, [field]: value } : nestedComp
        )

        // Reconstruct the nested tuple value
        const nestedTupleValue: any = {}
        updatedNestedComponents.forEach(nestedComp => {
          if (nestedComp.name.trim()) {
            nestedTupleValue[nestedComp.name] = nestedComp.value
          }
        })

        return {
          ...comp,
          components: updatedNestedComponents,
          value: JSON.stringify(nestedTupleValue)
        }
      }
      return comp
    })

    // Reconstruct the parent tuple value
    const parentTupleValue: any = {}
    updatedComponents.forEach(comp => {
      if (comp.name.trim()) {
        parentTupleValue[comp.name] = comp.value
      }
    })

    onUpdate('components', JSON.stringify(updatedComponents))
    onUpdate('value', JSON.stringify(parentTupleValue))
  }

  // Add nested tuple component
  const addNestedTupleComponent = (parentComponentId: string) => {
    const currentComponents = parameter.components || []

    const updatedComponents = currentComponents.map(comp => {
      if (comp.id === parentComponentId) {
        const newNestedComponent: Parameter = {
          id: Date.now().toString() + Math.random(),
          name: '',
          type: 'address',
          value: ''
        }

        const currentNestedComponents = comp.components || []
        const updatedNestedComponents = [...currentNestedComponents, newNestedComponent]

        return {
          ...comp,
          components: updatedNestedComponents
        }
      }
      return comp
    })

    onUpdate('components', JSON.stringify(updatedComponents))
  }

  // Remove nested tuple component
  const removeNestedTupleComponent = (parentComponentId: string, nestedComponentId: string) => {
    const currentComponents = parameter.components || []

    const updatedComponents = currentComponents.map(comp => {
      if (comp.id === parentComponentId && comp.components) {
        const updatedNestedComponents = comp.components.filter(nestedComp => nestedComp.id !== nestedComponentId)

        // Reconstruct the nested tuple value
        const nestedTupleValue: any = {}
        updatedNestedComponents.forEach(nestedComp => {
          if (nestedComp.name.trim()) {
            nestedTupleValue[nestedComp.name] = nestedComp.value
          }
        })

        return {
          ...comp,
          components: updatedNestedComponents,
          value: JSON.stringify(nestedTupleValue)
        }
      }
      return comp
    })

    // Reconstruct the parent tuple value
    const parentTupleValue: any = {}
    updatedComponents.forEach(comp => {
      if (comp.name.trim()) {
        parentTupleValue[comp.name] = comp.value
      }
    })

    onUpdate('components', JSON.stringify(updatedComponents))
    onUpdate('value', JSON.stringify(parentTupleValue))
  }

  // Save recent values when parameter is valid
  useEffect(() => {
    if (validation?.isValid) {
      if (parameter.name.trim()) {
        saveRecentValue('parameter_names', parameter.name.trim())
      }
      if (parameter.value.trim()) {
        saveRecentValue(parameter.type, parameter.value.trim())
      }
    }
  }, [validation?.isValid, parameter.name, parameter.value, parameter.type])

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (nameDropdownRef.current && !nameDropdownRef.current.contains(event.target as Node)) {
        setIsNameDropdownOpen(false)
      }
      if (valueDropdownRef.current && !valueDropdownRef.current.contains(event.target as Node)) {
        setIsValueDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])





  return (
    <div className={`border rounded-lg p-4 ${
      isInvalid
        ? 'border-red-300 bg-red-50'
        : 'border-gray-200 bg-gray-50'
    }`}>
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
        {/* Depth Column */}
        <div className="md:col-span-1">
          <div className="text-xs text-gray-500 font-medium text-center">
            {depth + 1}
          </div>
        </div>

        {/* Parameter Name */}
        <div className="relative md:col-span-2">
          <input
            ref={nameInputRef}
            type="text"
            value={parameter.name}
            onChange={(e) => handleNameChange(e.target.value)}
            onFocus={() => {
              const filtered = filterSuggestions(parameter.name, recentNames)
              setFilteredNameSuggestions(filtered)
              setIsNameDropdownOpen(filtered.length > 0)
            }}
            placeholder="Name (optional, e.g., to, amount)"
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:border-transparent text-sm ${
              isInvalid
                ? 'border-red-300 focus:ring-red-500'
                : 'border-gray-300 focus:ring-blue-500'
            }`}
          />
          {/* Name Dropdown */}
          {isNameDropdownOpen && filteredNameSuggestions.length > 0 && (
            <div
              ref={nameDropdownRef}
              className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-40 overflow-y-auto"
            >
              {filteredNameSuggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                  onClick={() => handleNameSelect(suggestion)}
                >
                  {suggestion}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Parameter Type */}
        <div className="md:col-span-2">
          <select
            value={parameter.type}
            onChange={(e) => onUpdate('type', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:border-transparent text-sm ${
              isInvalid
                ? 'border-red-300 focus:ring-red-500'
                : 'border-gray-300 focus:ring-blue-500'
            }`}
          >
            {SOLIDITY_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        {/* Parameter Value */}
        <div className="relative md:col-span-6">
          {parameter.type === 'bool' ? (
            <div className="flex items-center justify-center h-10">
              <button
                type="button"
                onClick={() => onUpdate('value', parameter.value === 'true' ? 'false' : 'true')}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  parameter.value === 'true'
                    ? 'bg-blue-600 focus:ring-blue-500'
                    : 'bg-gray-200 focus:ring-gray-500'
                } ${isInvalid ? 'ring-2 ring-red-500' : ''}`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    parameter.value === 'true' ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
              <span className="ml-3 text-sm font-medium text-gray-700">
                {parameter.value === 'true' ? 'true' : 'false'}
              </span>
            </div>
          ) : parameter.type === 'tuple' ? (
            <div className="flex items-center justify-center h-10">
              <button
                onClick={onAddTupleComponent}
                className="text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-3 py-2 rounded transition-colors border border-blue-200"
              >
                ➕ Add Component
              </button>
            </div>
          ) : parameter.type === 'address' ? (
            <AddressSelector
              value={parameter.value}
              onChange={handleValueChange}
              placeholder="Select address..."
              className={isInvalid ? 'border-red-300 focus:ring-red-500' : ''}
            />
          ) : (
            <>
              <input
                ref={valueInputRef}
                type="text"
                value={parameter.value}
                onChange={(e) => handleValueChange(e.target.value)}
                onFocus={() => {
                  const filtered = filterSuggestions(parameter.value, recentValues)
                  setFilteredValueSuggestions(filtered)
                  setIsValueDropdownOpen(filtered.length > 0)
                }}
                placeholder={getPlaceholderForType(parameter.type)}
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
        <div className="md:col-span-1 flex justify-center items-center">
          <button
            onClick={onRemove}
            className="w-8 h-8 text-white bg-red-500 hover:bg-red-600 rounded-md transition-colors flex items-center justify-center text-lg font-bold"
            title="Remove parameter"
          >
            ×
          </button>
        </div>
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
          {getTypeHint(parameter.type)}
        </div>
      )}
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
    case 'tuple':
      return 'Add components below'
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
    case 'tuple':
      return 'Add components to define the tuple structure'
    default:
      return ''
  }
}

export default ParameterInput
