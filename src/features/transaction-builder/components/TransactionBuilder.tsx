'use client'

import React, { useState, useCallback, useMemo, useEffect } from 'react'
import { Card } from '../../../components/ui/Card'
import { Button } from '../../../components/ui/Button'
import { AddressSelector } from '../../../components/ui'
import { useWalletManager } from '../../../hooks/useWalletManager'
import { encodeFunctionData, isAddress } from 'viem'
import { getDefaultValueForType } from '../../../utils/typeUtils'
import ParameterInput from './ParameterInput'
import ExampleTransactions from './ExampleTransactions'

interface IdentifierPath {
  path: string[] // Array of identifiers in order - first is parameter, rest are nested components
}

// Simplified state - just maintain ABI and data array
// UI parameters are derived from these for interaction

interface ValidationState {
  functionName: { isValid: boolean; message: string }
  targetAddress: { isValid: boolean; message: string }
  parameters: { [id: string]: { isValid: boolean; message: string } }
}


// Validation functions
const validateFunctionName = (name: string): { isValid: boolean; message: string } => {
  if (!name.trim()) {
    return { isValid: false, message: 'Function name is required' }
  }
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name)) {
    return { isValid: false, message: 'Invalid function name format' }
  }
  return { isValid: true, message: '' }
}

const validateAddress = (address: string): { isValid: boolean; message: string } => {
  if (!address.trim()) {
    return { isValid: false, message: 'Contract address is required' }
  }
  if (!isAddress(address)) {
    return { isValid: false, message: 'Invalid Ethereum address format' }
  }
  return { isValid: true, message: '' }
}

const validateDataValue = (input: any, value: any): { isValid: boolean; message: string } => {
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


const TransactionBuilder = React.memo(function TransactionBuilder() {
  const { currentAccount, sendTransaction, publicClient } = useWalletManager()

  // Core state - maintain ABI and dataArray for viem.encodeFunctionData
  // Use timestamp-based identifiers for idempotent operations
  const [abi, setAbi] = useState<any[]>([])
  const [dataArray, setDataArray] = useState<Map<string, any>>(new Map())
  const [parameterOrder, setParameterOrder] = useState<string[]>([]) // Maintain order of parameters
  const [functionName, setFunctionName] = useState<string>('')
  const [targetAddress, setTargetAddress] = useState<string>('')

  const [isEncoding, setIsEncoding] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [isCalling, setIsCalling] = useState(false)
  const [isCopying, setIsCopying] = useState(false)

  // Local state for displaying results
  const [encodedData, setEncodedData] = useState<string>('')
  const [transactionHash, setTransactionHash] = useState<string>('')
  const [callResult, setCallResult] = useState<{ success: boolean; data: string; message: string } | null>(null)
  const [isEncodedDataInSync, setIsEncodedDataInSync] = useState<boolean>(false)

  // Clear call result and mark encoded data as out of sync when function name or parameters change
  useEffect(() => {
    if (callResult) {
      setCallResult(null)
    }
    if (encodedData) {
      setIsEncodedDataInSync(false)
    }
  }, [functionName, abi, dataArray, parameterOrder])

  // Validation state
  const validationState = useMemo((): ValidationState => {
    const functionNameValidation = validateFunctionName(functionName)
    const targetAddressValidation = validateAddress(targetAddress)

    // Validate parameters
    const parametersValidation: { [id: string]: { isValid: boolean; message: string } } = {}

    if (abi.length > 0 && abi[0]?.inputs) {
      abi[0].inputs.forEach((input: any, index: number) => {
        const identifier = parameterOrder[index]
        const value = identifier ? dataArray.get(identifier) : undefined
        parametersValidation[`param-${identifier || index}`] = validateDataValue(input, value)
      })
    }

    return {
      functionName: functionNameValidation,
      targetAddress: targetAddressValidation,
      parameters: parametersValidation
    }
  }, [functionName, targetAddress, abi, dataArray, parameterOrder])

    // Check if all inputs are valid (for encoding - target address not required)
  const isAllValid = useMemo(() => {
    const functionNameValid = validationState.functionName.isValid
    const allParametersValid = Object.values(validationState.parameters).every(v => v.isValid)

    return functionNameValid && allParametersValid
  }, [validationState])

  // Copy to clipboard function
  const copyToClipboard = useCallback(async (text: string) => {
    setIsCopying(true)
    try {
      await navigator.clipboard.writeText(text)
      // You could add a toast notification here
    } catch (error) {
      console.error('Failed to copy to clipboard:', error)
    } finally {
      setIsCopying(false)
    }
  }, [])

  // Get block explorer URL
  const getBlockExplorerUrl = useCallback((hash: string) => {
    if (!publicClient) {
      return `https://etherscan.io/tx/${hash}` // fallback to mainnet
    }

    const chainId = publicClient.chain?.id
    let baseUrl = 'https://etherscan.io/tx/' // default to mainnet

    switch (chainId) {
      case 1: // mainnet
        baseUrl = 'https://etherscan.io/tx/'
        break
      case 11155111: // sepolia
        baseUrl = 'https://sepolia.etherscan.io/tx/'
        break
      case 5: // goerli
        baseUrl = 'https://goerli.etherscan.io/tx/'
        break
      case 137: // polygon
        baseUrl = 'https://polygonscan.com/tx/'
        break
      case 80001: // mumbai
        baseUrl = 'https://mumbai.polygonscan.com/tx/'
        break
      default:
        baseUrl = 'https://etherscan.io/tx/'
    }

    return `${baseUrl}${hash}`
  }, [publicClient])

  // Update dataArray value at specific path
  const updateDataValue = useCallback((path: IdentifierPath, newValue: any) => {
    setDataArray(prev => {
      const newMap = new Map(prev)
      const parameterIdentifier = path.path[0] // First identifier is the parameter

      if (path.path.length === 1) {
        // Simple parameter update
        newMap.set(parameterIdentifier, newValue)
      } else {
        // Nested update - need to update the parameter's nested data
        const parameterData = newMap.get(parameterIdentifier)
        if (parameterData && typeof parameterData === 'object') {
          const newData = { ...parameterData }

          // Navigate to the nested location and update
          let current = newData
          for (let i = 1; i < path.path.length - 1; i++) {
            const pathSegment = path.path[i]

            // Check if current is an array (array elements have {value, identifier} structure)
            if (Array.isArray(current)) {
              const arrayItem = current.find((item: any) => item.identifier === pathSegment)
              if (arrayItem) {
                current = arrayItem
              } else {
                // Path doesn't exist, can't update
                return prev
              }
            } else if (current[pathSegment] && typeof current[pathSegment] === 'object') {
              current = current[pathSegment]
            } else {
              // Path doesn't exist, can't update
              return prev
            }
          }

          // Update the final value
          const finalKey = path.path[path.path.length - 1]

          // Check if current is an array item (has {value, identifier} structure)
          if (current && typeof current === 'object' && 'identifier' in current) {
            current.value = newValue
          } else if (current && typeof current === 'object') {
            current[finalKey] = newValue
          }

          newMap.set(parameterIdentifier, newData)
        }
      }

      return newMap
    })
  }, [])

  // Add a new parameter
  const addParameter = useCallback(() => {
    // Check if the last parameter is already a default parameter (idempotent operation)
    if (abi.length > 0 && abi[0]?.inputs && abi[0].inputs.length > 0) {
      const lastInput = abi[0].inputs[abi[0].inputs.length - 1]
      if (lastInput.name === `param${abi[0].inputs.length - 1}` && lastInput.type === 'address') {
        return // Skip if last parameter is already a default parameter (idempotent)
      }
    }

    const identifier = Date.now().toString()
    const newInput = {
      name: `param${parameterOrder.length}`,
      type: 'address',
      identifier // Add identifier to input for reference
    }

    setAbi(prev => {
      if (prev.length === 0) {
        // Create new ABI function
        return [{
          type: 'function',
          name: functionName || 'newFunction',
          stateMutability: 'nonpayable',
          inputs: [newInput],
          outputs: []
        }]
      } else {
        // Add to existing ABI
        const newAbi = [...prev]
        newAbi[0] = {
          ...newAbi[0],
          inputs: [...newAbi[0].inputs, newInput]
        }
        return newAbi
      }
    })

    setParameterOrder(prev => [...prev, identifier])
    setDataArray(prev => {
      const newMap = new Map(prev)
      newMap.set(identifier, '')
      return newMap
    })
  }, [abi, functionName, parameterOrder.length])

  // Remove a parameter
  const removeParameter = useCallback((identifier: string) => {
    // Skip if identifier doesn't exist (idempotent operation)
    if (!parameterOrder.includes(identifier)) {
      return
    }

    setAbi(prev => {
      if (prev.length === 0) return prev
      const newAbi = [...prev]
      newAbi[0] = {
        ...newAbi[0],
        inputs: newAbi[0].inputs.filter((input: any) => input.identifier !== identifier)
      }
      return newAbi
    })

    setParameterOrder(prev => prev.filter(id => id !== identifier))
    setDataArray(prev => {
      const newMap = new Map(prev)
      newMap.delete(identifier)
      return newMap
    })
  }, [parameterOrder])

  // Update parameter name
  const updateParameterName = useCallback((identifier: string, newName: string) => {
    setAbi(prev => {
      if (prev.length === 0) return prev
      const newAbi = [...prev]
      newAbi[0] = {
        ...newAbi[0],
        inputs: newAbi[0].inputs.map((input: any) =>
          input.identifier === identifier ? { ...input, name: newName } : input
        )
      }
      return newAbi
    })
  }, [])

  // Update parameter type
  const updateParameterType = useCallback((identifier: string, newType: string) => {
    // Update the ABI structure with the new type for the specified parameter
    setAbi(prev => {
      if (prev.length === 0) return prev
      const newAbi = [...prev]
      newAbi[0] = {
        ...newAbi[0],
        // Map through all inputs and update only the one with the specified identifier
        inputs: newAbi[0].inputs.map((input: any) =>
          input.identifier === identifier ? { ...input, type: newType } : input
        )
      }
      return newAbi
    })

    // Reset data value when type changes to prevent type mismatches
    // This ensures the data array stays in sync with the ABI structure
    setDataArray(prev => {
      const newMap = new Map(prev)
      newMap.set(identifier, '') // Clear the value for the changed parameter
      return newMap
    })
  }, [])

  // Add tuple component to ABI structure (supports both top-level and nested tuples)
  const addTupleComponent = useCallback((target: string | IdentifierPath, componentName: string, componentType: string) => {
    const componentIdentifier = Date.now().toString()

    setAbi(prev => {
      if (prev.length === 0) return prev
      const newAbi = [...prev]

      // Determine if target is a parameter identifier (string) or a path (IdentifierPath)
      const isPath = typeof target === 'object' && target.path && Array.isArray(target.path)
      const path = isPath ? target.path : [target as string]

      if (path.length === 0) return prev // Skip if no path (idempotent)

      // Find parameter by first identifier
      const parameterIndex = newAbi[0].inputs.findIndex((input: any) => input.identifier === path[0])
      if (parameterIndex === -1) return prev // Skip if parameter not found (idempotent)

      // Navigate to the target component
      let current = newAbi[0].inputs[parameterIndex]

      // For nested tuples, navigate through the remaining path
      for (let i = 1; i < path.length; i++) {
        const pathSegment = path[i]
        if (current.components && Array.isArray(current.components)) {
          const componentIndex = current.components.findIndex((comp: any) => comp.identifier === pathSegment)
          if (componentIndex !== -1) {
            current = current.components[componentIndex]
          } else {
            return prev // Skip if component not found (idempotent)
          }
        }
      }

      // Ensure the target has components array
      if (!current.components) {
        current.components = []
      }

      // Check if we're trying to add a component that already exists (idempotent)
      const existingComponent = current.components.find(
        (comp: any) => comp.name === componentName && comp.type === componentType
      )
      if (existingComponent) {
        return prev // Skip if component already exists (idempotent)
      }

      // Add the new component
      current.components.push({
        name: componentName,
        type: componentType,
        identifier: componentIdentifier
      })

      return newAbi
    })
  }, [])

  // Update tuple component type in ABI structure using path
  const updateTupleComponentType = useCallback((path: IdentifierPath, newType: string) => {
    setAbi(prev => {
      if (prev.length === 0 || path.path.length === 0) return prev
      const newAbi = [...prev]

      // Find parameter by first identifier
      const parameterIndex = newAbi[0].inputs.findIndex((input: any) => input.identifier === path.path[0])
      if (parameterIndex === -1) return prev // Skip if parameter not found (idempotent)

      // Navigate to the component using the path
      let current = newAbi[0].inputs[parameterIndex]

      // Navigate through the remaining path to find the target component
      for (let i = 1; i < path.path.length; i++) {
        const pathSegment = path.path[i]
        // Component identifier - find by identifier
        if (current.components && Array.isArray(current.components)) {
          const componentIndex = current.components.findIndex((comp: any) => comp.identifier === pathSegment)
          if (componentIndex !== -1) {
            current = current.components[componentIndex]
          } else {
            return prev // Skip if component not found (idempotent)
          }
        }
      }

      // Update the type
      if (current && typeof current === 'object') {
        current.type = newType
      }

      return newAbi
    })
  }, [])

  // Remove tuple component from ABI structure using path
  const removeTupleComponent = useCallback((path: IdentifierPath) => {
    // Track whether ABI removal was successful
    let abiRemovalSuccessful = false
    let componentName: string | null = null

    setAbi(prev => {
      if (prev.length === 0 || path.path.length === 0) return prev
      const newAbi = [...prev]

      // Find parameter by first identifier
      const parameterIndex = newAbi[0].inputs.findIndex((input: any) => input.identifier === path.path[0])
      if (parameterIndex === -1) return prev // Skip if parameter not found (idempotent)

      // Navigate to the component to get its name before removing
      let current = newAbi[0].inputs[parameterIndex]
      for (let i = 1; i < path.path.length; i++) {
        const pathSegment = path.path[i]
        if (current.components && Array.isArray(current.components)) {
          const componentIndex = current.components.findIndex((comp: any) => comp.identifier === pathSegment)
          if (componentIndex !== -1) {
            current = current.components[componentIndex]
            if (i === path.path.length - 1) {
              componentName = current.name // This is the component to be removed
            }
          }
        }
      }

      // Navigate to the parent component
      current = newAbi[0].inputs[parameterIndex]
      for (let i = 1; i < path.path.length - 1; i++) {
        const pathSegment = path.path[i]
        if (current.components && Array.isArray(current.components)) {
          const componentIndex = current.components.findIndex((comp: any) => comp.identifier === pathSegment)
          if (componentIndex !== -1) {
            current = current.components[componentIndex]
          } else {
            return prev // Skip if component not found (idempotent)
          }
        }
      }

      // Remove the component at the final identifier (idempotent operation)
      const finalIdentifier = path.path[path.path.length - 1]
      if (current.components) {
        const componentExists = current.components.some((comp: any) => comp.identifier === finalIdentifier)
        if (componentExists) {
          current.components = current.components.filter((comp: any) => comp.identifier !== finalIdentifier)
          abiRemovalSuccessful = true // Mark ABI removal as successful
        }
      }

      return newAbi
    })

    // Only remove data if ABI removal was successful
    if (abiRemovalSuccessful && componentName) {
      setDataArray(prev => {
        const newMap = new Map(prev)
        const parameterIdentifier = path.path[0]
        const parameterData = newMap.get(parameterIdentifier)

        if (parameterData) {
          // Check if this is an array (tuple[])
          if (Array.isArray(parameterData)) {
            // For tuple[] arrays, remove the component from all tuples
            const newArray = parameterData.map((item: any) => {
              if (item && typeof item === 'object' && item.value && typeof item.value === 'object') {
                const newValue = { ...item.value }
                delete newValue[componentName!]
                return { ...item, value: newValue }
              }
              return item
            })
            newMap.set(parameterIdentifier, newArray)
          } else if (typeof parameterData === 'object') {
            // For single tuples, remove the component by name
            const newData = { ...parameterData }
            delete newData[componentName!]
            newMap.set(parameterIdentifier, newData)
          }
        }

        return newMap
      })
    }
  }, [])


  // Load example ABI transaction
  const loadExample = useCallback((example: any) => {
    const abiFunction = example.abi[0]

    setFunctionName(abiFunction.name)
    setTargetAddress(example.targetAddress)

    // Helper function to add identifiers to ABI components recursively
    const addIdentifiersToAbi = (inputs: any[], dataValues: any[]): { abi: any[], dataMap: Map<string, any>, parameterOrder: string[] } => {
      const dataMap = new Map()
      const parameterOrder: string[] = []

      const processedInputs = inputs.map((input: any, index: number) => {
        const identifier = Date.now().toString() + Math.random().toString(36).substr(2, 9)
        const dataValue = dataValues[index]

        // Handle tuple components recursively
        if (input.components && Array.isArray(input.components)) {
          // Just add identifiers to tuple components - keep the data structure simple
          const processedComponents = input.components.map((comp: any) => ({
            ...comp,
            identifier: Date.now().toString() + Math.random().toString(36).substr(2, 9)
          }))

          // For tuple[] types, structure the data properly
          if (input.type.endsWith('[]') && Array.isArray(dataValue)) {
            const structuredData = dataValue.map((item: any) => ({
              identifier: Date.now().toString() + Math.random().toString(36).substr(2, 9),
              value: item
            }))
            dataMap.set(identifier, structuredData)
          } else {
            // For single tuples, store the data as-is
            dataMap.set(identifier, dataValue)
          }

          parameterOrder.push(identifier)

          return {
            ...input,
            identifier,
            components: processedComponents
          }
        }

        // Store data value
        dataMap.set(identifier, dataValue)
        parameterOrder.push(identifier)

        return {
          ...input,
          identifier
        }
      })

      return { abi: processedInputs, dataMap, parameterOrder }
    }

    // Process the ABI and data
    const { abi: processedAbi, dataMap: newDataMap, parameterOrder: newParameterOrder } =
      addIdentifiersToAbi(abiFunction.inputs, example.data || [])

    // Create the new ABI structure
    const newAbi = [{
      ...abiFunction,
      inputs: processedAbi
    }]

    setAbi(newAbi)
    setDataArray(newDataMap)
    setParameterOrder(newParameterOrder)

  }, [])

  // Encode function data using the ABI structure
  const encodeData = useCallback(async () => {
    if (!isAllValid) {
      return
    }

    if (!functionName || !abi[0] || parameterOrder.length === 0) {
      return
    }

    setIsEncoding(true)

    try {
      // Create ABI item with the current function name
      const abiItem = {
        ...abi[0],
        name: functionName
      }

      // Filter out empty values and validate before encoding
      const validDataArray = parameterOrder.map((identifier, index) => {
        const input = abi[0].inputs[index]
        const value = dataArray.get(identifier)
        if (!input) return value

        // Skip empty values for required fields
        if (value === '' || value === null || value === undefined) {
          throw new Error(`Parameter ${index} (${input.name}) is required but empty`)
        }

        return value
      })

      // Use filtered dataArray - it's already in the correct format for viem
      const encodedData = encodeFunctionData({
        abi: [abiItem],
        args: validDataArray
      })

      setEncodedData(encodedData)
      setIsEncodedDataInSync(true)
    } catch (error) {
      console.error('Encoding error:', error)
      setEncodedData('')
      setIsEncodedDataInSync(false)
    } finally {
      setIsEncoding(false)
    }
  }, [functionName, abi, dataArray, parameterOrder, isAllValid])

  // Send transaction
  const sendTransactionData = useCallback(async () => {
    if (!currentAccount) {
      return
    }

    if (!encodedData) {
      return
    }

    if (!targetAddress.trim()) {
      return
    }

    setIsSending(true)

    try {
      // Create transaction object
      const tx = {
        to: targetAddress as `0x${string}`,
        data: encodedData,
        value: 0n
      }

      const txHash = await sendTransaction(tx)

      setTransactionHash(txHash)
    } catch (error) {
      console.error('Transaction error:', error)
    } finally {
      setIsSending(false)
    }
  }, [currentAccount, encodedData, targetAddress, sendTransaction])

  // Eth call function
  const callTransaction = useCallback(async () => {
    if (!encodedData) {
      return
    }

    if (!targetAddress.trim()) {
      return
    }

    if (!publicClient) {
      setCallResult({
        success: false,
        data: '',
        message: 'No wallet connected or public client not available'
      })
      return
    }


    setIsCalling(true)

    try {
      // Ensure we have a valid address
      if (!currentAccount?.address) {
        throw new Error('No connected wallet address available')
      }


      // Create call object with connected address as from
      const callData = {
        to: targetAddress as `0x${string}`,
        data: encodedData as `0x${string}`,
        value: 0n,
        account: currentAccount.address as `0x${string}`
      }

      // Perform actual eth_call
      const result = await publicClient.call(callData)

      setCallResult({
        success: true,
        data: result.data || '0x',
        message: 'Call executed successfully'
      })
    } catch (error) {
      // Handle different types of errors
      let errorMessage = 'Call failed'

      if (error instanceof Error) {
        // Check for revert reasons in the error message
        if (error.message.includes('execution reverted')) {
          // Try to extract revert reason
          const revertMatch = error.message.match(/execution reverted: (.+)/)
          if (revertMatch) {
            errorMessage = `Reverted: ${revertMatch[1]}`
          } else {
            errorMessage = 'Transaction reverted'
          }
        } else if (error.message.includes('insufficient funds')) {
          errorMessage = 'Insufficient funds for gas'
        } else if (error.message.includes('nonce')) {
          errorMessage = 'Invalid nonce'
        } else {
          errorMessage = error.message
        }
      }

      setCallResult({
        success: false,
        data: '',
        message: errorMessage
      })
    } finally {
      setIsCalling(false)
    }
  }, [encodedData, targetAddress, publicClient, currentAccount])

  return (
    <div className="space-y-6">
      {/* Function Configuration */}
      <Card title="Function Configuration" subtitle="Define the function you want to call">
        <div className="space-y-4">
          <div>
            <label htmlFor="functionName" className="block text-sm font-medium text-gray-700 mb-2">
              Function Name
            </label>
            <input
              id="functionName"
              type="text"
              value={functionName}
              onChange={(e) => setFunctionName(e.target.value)}
              placeholder="e.g., transfer, approve, mint"
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:border-transparent ${
                functionName.trim()
                  ? validationState.functionName.isValid
                    ? 'border-green-300 focus:ring-green-500'
                    : 'border-red-300 focus:ring-red-500'
                  : 'border-gray-300 focus:ring-blue-500'
              }`}
            />
            {functionName.trim() && !validationState.functionName.isValid && (
              <p className="mt-1 text-sm text-red-600">{validationState.functionName.message}</p>
            )}
          </div>
        </div>
      </Card>

        {/* Parameters */}
        <Card title="Function Parameters" subtitle="Configure function parameters">
          <div className="space-y-4">
            {/* Column headers - only show when there are parameters */}
            {abi[0]?.inputs && abi[0].inputs.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 px-4">
                <div className="text-sm font-medium text-gray-700 text-center">Annotation</div>
                <div className="text-sm font-medium text-gray-700 md:col-span-2">Name</div>
                <div className="text-sm font-medium text-gray-700 md:col-span-2">Type</div>
                <div className="text-sm font-medium text-gray-700 md:col-span-6">Value</div>
                <div className="text-sm font-medium text-gray-700 text-center">Delete</div>
              </div>
            )}

            {/* Render parameters - ParameterInput handles recursive rendering */}
            {abi[0]?.inputs && abi[0].inputs.map((input: any, index: number) => {
              const identifier = input.identifier || parameterOrder[index]
              const dataValue = identifier ? dataArray.get(identifier) : undefined
              const validationKey = `param-${identifier || index}`

              return (
                <div key={`${input.name}-${identifier}`} className={`border rounded-lg p-4 ${
                  validationState.parameters[validationKey] && !validationState.parameters[validationKey].isValid && dataValue
                    ? 'border-red-300 bg-red-50'
                    : 'border-gray-200 bg-gray-50'
                }`}>
                  <ParameterInput
                    abiInput={input}
                    dataValue={dataValue}
                    validation={validationState.parameters[validationKey]}
                    onUpdate={(newValue) => updateDataValue({ path: [identifier] }, newValue)}
                    onRemove={() => removeParameter(identifier)}
                    onUpdateName={(newName) => updateParameterName(identifier, newName)}
                    onUpdateType={(newType) => updateParameterType(identifier, newType)}
                    onAddTupleComponent={(target, componentName, componentType) => addTupleComponent(target, componentName, componentType)}
                    onUpdateTupleComponentType={(path, newType) => updateTupleComponentType(path, newType)}
                    onRemoveTupleComponent={(path) => removeTupleComponent(path)}
                    annotation="1"
                    currentPath={{ path: [identifier] }}
                  />
                </div>
              )
            })}

            <Button
              onClick={addParameter}
              variant="outline"
              className="w-full"
            >
              ➕ Add Parameter
            </Button>
          </div>
        </Card>

      {/* Action Buttons */}
      <Card title="Transaction Actions" subtitle={`Encode and execute your transaction${publicClient?.chain?.name ? ` on ${publicClient.chain.name}` : ''}`}>
        <div className="space-y-4">
          {/* Encode Button with Result */}
          <div className="space-y-2">
            <Button
              onClick={encodeData}
              loading={isEncoding}
              disabled={!isAllValid}
              className="w-full"
            >
              🔧 Encode Data {!isAllValid ? '(Fix validation errors)' : ''}
            </Button>
            {encodedData && (
              <div className={`p-3 rounded-md ${isEncodedDataInSync ? 'bg-gray-100' : 'bg-yellow-50 border border-yellow-200'}`}>
                <div className="flex justify-between items-center mb-1">
                  <div className={`text-sm font-medium ${isEncodedDataInSync ? 'text-gray-700' : 'text-yellow-700'}`}>
                    Encoded Data: {!isEncodedDataInSync && <span className="text-yellow-600">(Out of Sync)</span>}
                  </div>
                  <Button
                    onClick={() => copyToClipboard(encodedData)}
                    loading={isCopying}
                    variant="outline"
                    size="sm"
                    className="text-xs"
                  >
                    📋 Copy
                  </Button>
                </div>
                <div className={`text-xs font-mono break-all ${isEncodedDataInSync ? 'text-gray-600' : 'text-yellow-600'}`}>{encodedData}</div>
              </div>
            )}
          </div>

          {/* Target Address */}
          <div>
            <label htmlFor="targetAddress" className="block text-sm font-medium text-gray-700 mb-2">
              Target Contract Address
            </label>
            <AddressSelector
              value={targetAddress}
              onChange={setTargetAddress}
              placeholder="Select contract address..."
              className={targetAddress.trim()
                ? validationState.targetAddress.isValid
                  ? 'border-green-300 focus:ring-green-500'
                  : 'border-red-300 focus:ring-red-500'
                : ''
              }
            />
            {targetAddress.trim() && !validationState.targetAddress.isValid && (
              <p className="mt-1 text-sm text-red-600">{validationState.targetAddress.message}</p>
            )}
          </div>

          {/* Eth Call and Send Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Eth Call */}
            <div className="space-y-2">
              <Button
                onClick={callTransaction}
                loading={isCalling}
                disabled={!encodedData || !targetAddress.trim() || !validationState.targetAddress.isValid || !currentAccount}
                variant="outline"
                className="w-full"
              >
                🔗 Eth Call
              </Button>
              {callResult && (
                <div className={`p-3 rounded-md ${callResult.success ? 'bg-blue-50' : 'bg-red-50'}`}>
                  <div className={`text-sm font-medium mb-1 ${callResult.success ? 'text-blue-700' : 'text-red-700'}`}>
                    {callResult.success ? 'Call Result:' : 'Call Failed:'}
                  </div>
                  <div className={`text-xs font-mono break-all ${callResult.success ? 'text-blue-600' : 'text-red-600'}`}>
                    {callResult.success ? callResult.data : callResult.message}
                  </div>
                </div>
              )}
            </div>

            {/* Eth Send */}
            <div className="space-y-2">
              <Button
                onClick={sendTransactionData}
                loading={isSending}
                disabled={!encodedData || !currentAccount || !targetAddress.trim() || !validationState.targetAddress.isValid}
                variant="success"
                className="w-full"
              >
                📤 Eth Send
              </Button>
              {transactionHash && (
                <div className="bg-green-50 p-3 rounded-md">
                  <div className="flex justify-between items-center mb-1">
                    <div className="text-sm font-medium text-green-700">Transaction Hash:</div>
                    <Button
                      onClick={() => copyToClipboard(transactionHash)}
                      loading={isCopying}
                      variant="outline"
                      size="sm"
                      className="text-xs"
                    >
                      📋 Copy
                    </Button>
                  </div>
                  <div className="text-xs font-mono text-green-600 break-all mb-2">{transactionHash}</div>
                  <a
                    href={getBlockExplorerUrl(transactionHash)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-green-600 hover:text-green-800 underline"
                  >
                    🔍 View on Block Explorer
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Example ABI Transactions */}
      <ExampleTransactions onLoadExample={loadExample} />
    </div>
  )
})

export default TransactionBuilder
