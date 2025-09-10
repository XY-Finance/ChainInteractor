'use client'

import React, { useState, useCallback, useMemo } from 'react'
import { Card } from '../../../components/ui/Card'
import { Button } from '../../../components/ui/Button'
import { AddressSelector } from '../../../components/ui'
import { useWalletManager } from '../../../hooks/useWalletManager'
import { encodeFunctionData, type Address, isAddress } from 'viem'
import ParameterInput from './ParameterInput'
import ExampleTransactions from './ExampleTransactions'
import { isStructuredType } from '../utils/typeUtils'

export interface Parameter {
  id: string
  name: string
  type: string
  value: string
  components?: Parameter[] // For tuple types
}

export interface TransactionData {
  functionName: string
  targetAddress: string
  parameters: Parameter[]
}

interface ValidationState {
  functionName: { isValid: boolean; message: string }
  targetAddress: { isValid: boolean; message: string }
  parameters: { [id: string]: { isValid: boolean; message: string } }
}

interface TransactionBuilderProps {
  // No props needed
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

// Helper functions for structured types (arrays and tuples) - now imported from utils

const validateParameter = (parameter: Parameter): { isValid: boolean; message: string } => {
  if (!parameter.value.trim()) {
    return { isValid: false, message: 'Parameter value is required' }
  }

  // Type-specific validation
  const value = parameter.value.trim()

  // Handle all types in a unified switch statement
  switch (parameter.type) {
    // Handle structured types (arrays and tuples) - treat them identically
    default:
      if (isStructuredType(parameter.type)) {
        try {
          const structuredValue = JSON.parse(value)

          // For arrays, expect an array; for tuples, expect an object
          if (parameter.type === 'array') {
            if (!Array.isArray(structuredValue)) {
              return { isValid: false, message: 'Must be a JSON array' }
            }
          } else {
            if (typeof structuredValue !== 'object' || Array.isArray(structuredValue)) {
              return { isValid: false, message: 'Must be a JSON object' }
            }
          }

          // Validate each component/element
          if (parameter.components && parameter.components.length > 0) {
            for (let i = 0; i < parameter.components.length; i++) {
              const component = parameter.components[i]
              const componentValue = parameter.type === 'array'
                ? structuredValue[i]
                : structuredValue[component.name]

              if (componentValue === undefined) {
                return { isValid: false, message: `Missing ${parameter.type === 'array' ? 'element' : 'component'}: ${component.name}` }
              }

              const componentValidation = validateParameter({
                ...component,
                value: String(componentValue)
              })
              if (!componentValidation.isValid) {
                return { isValid: false, message: `Invalid ${component.name}: ${componentValidation.message}` }
              }
            }
          }
        } catch (error) {
          return { isValid: false, message: `Invalid JSON format for ${parameter.type === 'array' ? 'array' : 'tuple'}` }
        }
        return { isValid: true, message: '' }
      }
      break
    case 'address':
      if (!isAddress(value)) {
        return { isValid: false, message: 'Invalid address format' }
      }
      break
    case 'uint256':
    case 'uint128':
    case 'uint64':
    case 'uint32':
    case 'uint16':
    case 'uint8':
      if (!/^\d+$/.test(value) || BigInt(value) < 0n) {
        return { isValid: false, message: 'Must be a positive integer' }
      }
      break
    case 'int256':
    case 'int128':
    case 'int64':
    case 'int32':
    case 'int16':
    case 'int8':
      if (!/^-?\d+$/.test(value)) {
        return { isValid: false, message: 'Must be an integer' }
      }
      break
    case 'bool':
      if (!['true', 'false'].includes(value.toLowerCase())) {
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
      if (!/^0x[0-9a-fA-F]*$/.test(value)) {
        return { isValid: false, message: 'Must be hex format (0x...)' }
      }
      break
  }

  return { isValid: true, message: '' }
}

const TransactionBuilder = React.memo(function TransactionBuilder() {
  const { currentAccount, sendTransaction, publicClient } = useWalletManager()

  const [transactionData, setTransactionData] = useState<TransactionData>({
    functionName: '',
    targetAddress: '',
    parameters: []
  })

  const [isEncoding, setIsEncoding] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [isCalling, setIsCalling] = useState(false)
  const [isCopying, setIsCopying] = useState(false)

  // Local state for displaying results
  const [encodedData, setEncodedData] = useState<string>('')
  const [transactionHash, setTransactionHash] = useState<string>('')
  const [callResult, setCallResult] = useState<{ success: boolean; data: string; message: string } | null>(null)

  // Validation state
  const validationState = useMemo((): ValidationState => {
    const functionNameValidation = validateFunctionName(transactionData.functionName)
    const targetAddressValidation = validateAddress(transactionData.targetAddress)

    const parametersValidation: { [id: string]: { isValid: boolean; message: string } } = {}
    transactionData.parameters.forEach(param => {
      parametersValidation[param.id] = validateParameter(param)
    })

    return {
      functionName: functionNameValidation,
      targetAddress: targetAddressValidation,
      parameters: parametersValidation
    }
  }, [transactionData])

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

  // Add a new parameter
  const addParameter = useCallback(() => {
    const newParameter: Parameter = {
      id: Date.now().toString(),
      name: '',
      type: 'address',
      value: ''
    }

    setTransactionData(prev => ({
      ...prev,
      parameters: [...prev.parameters, newParameter]
    }))
  }, [])

  // Helper function to find parameter by ID recursively
  const findParameterById = useCallback((parameters: Parameter[], id: string): Parameter | null => {
    for (const param of parameters) {
      if (param.id === id) {
        return param
      }
      if (param.components) {
        const found = findParameterById(param.components, id)
        if (found) return found
      }
    }
    return null
  }, [])

  // Add a new component to a parameter
  const addComponentTo = useCallback((parameterId: string) => {
    setTransactionData(prev => {
      const parameter = findParameterById(prev.parameters, parameterId)
      if (!parameter) return prev

      const newComponent: Parameter = {
        id: Date.now().toString() + Math.random(),
        name: '',
        type: 'address',
        value: ''
      }

      // Update the parameter with the new component
      return {
        ...prev,
        parameters: prev.parameters.map(param => {
          if (param.id === parameterId) {
            return { ...param, components: [...(param.components || []), newComponent] }
          }
          if (param.components) {
            return { ...param, components: param.components.map(comp =>
              comp.id === parameterId
                ? { ...comp, components: [...(comp.components || []), newComponent] }
                : comp
            )}
          }
          return param
        })
      }
    })
  }, [findParameterById])


  // Remove a parameter
  const removeParameter = useCallback((id: string, parentId?: string) => {
    setTransactionData(prev => {
      // Helper function to remove component recursively
      const removeComponent = (parameters: Parameter[]): Parameter[] => {
        return parameters.filter(param => {
          if (param.id === id) {
            return false // Remove this parameter
          }
          if (param.components) {
            param.components = removeComponent(param.components)
          }
          return true // Keep this parameter
        })
      }

      return {
        ...prev,
        parameters: removeComponent(prev.parameters)
      }
    })
  }, [])

  // Update parameter
  const updateParameter = useCallback((id: string, field: keyof Parameter, value: string, parentId?: string) => {
    setTransactionData(prev => {
      const parameter = findParameterById(prev.parameters, id)
      if (!parameter) return prev

      // Update the parameter
      return {
        ...prev,
        parameters: prev.parameters.map(p => {
          if (p.id === id) {
            if (field === 'components') {
              try {
                const components = JSON.parse(value)
                return { ...p, components }
              } catch {
                return p
              }
            }

            // Initialize structured components when type is changed to a structured type
            if (field === 'type' && isStructuredType(value) && !p.components) {
              return { ...p, [field]: value, components: [] }
            }

            // Clear components when switching from structured to non-structured
            if (field === 'type' && isStructuredType(p.type) && !isStructuredType(value)) {
              return { ...p, [field]: value, components: undefined }
            }

            return { ...p, [field]: value }
          }

          // Update nested components
          if (p.components) {
            return { ...p, components: p.components.map(comp =>
              comp.id === id
                ? { ...comp, [field]: value }
                : comp
            )}
          }

          return p
        })
      }
    })
  }, [findParameterById])

  // Update function name
  const updateFunctionName = useCallback((functionName: string) => {
    setTransactionData(prev => ({
      ...prev,
      functionName
    }))
  }, [])

  // Update target address
  const updateTargetAddress = useCallback((targetAddress: string) => {
    setTransactionData(prev => ({
      ...prev,
      targetAddress
    }))
  }, [])

  // Load example transaction
  const loadExample = useCallback((example: any) => {
    const parameters = example.parameters.map((p: any) => ({
      id: Date.now().toString() + Math.random(),
      name: p.name,
      type: p.type,
      value: p.value
    }))

    setTransactionData({
      functionName: example.functionName,
      targetAddress: example.targetAddress,
      parameters
    })
  }, [])

  // Encode function data
  const encodeData = useCallback(async () => {

    if (!isAllValid) {
      return
    }

    setIsEncoding(true)

    try {
      // Recursive function to build ABI inputs with tuple support
      const buildAbiInputs = (params: Parameter[]) => {
        return params.map(p => {
          const input: any = {
            name: p.name,
            type: p.type
          }

          if (p.type === 'tuple' && p.components && p.components.length > 0) {
            input.components = buildAbiInputs(p.components)
          }

          return input
        })
      }

      // Create ABI item object
      const abiItem = {
        inputs: buildAbiInputs(transactionData.parameters),
        name: transactionData.functionName,
        outputs: [], // TODO: We'll assume no outputs for now, can be enhanced later
        stateMutability: 'nonpayable', // TODO: Default to nonpayable, can be enhanced later
        type: 'function'
      }


      // Recursive function to encode values with tuple and array support
      const encodeValues = (params: Parameter[]): any[] => {
        return params.map(p => {
          const value = p.value.trim()

          // Handle structured types (arrays and tuples) - treat them identically
          if (isStructuredType(p.type)) {
            try {
              const structuredValue = JSON.parse(value)

              // For arrays, expect an array; for tuples, expect an object
              if (p.type === 'array') {
                if (!Array.isArray(structuredValue)) {
                  throw new Error(`Expected array for parameter ${p.name}`)
                }
              } else {
                if (typeof structuredValue !== 'object' || Array.isArray(structuredValue)) {
                  throw new Error(`Expected object for parameter ${p.name}`)
                }
              }

              // Encode each component/element
              if (p.components && p.components.length > 0) {
                if (p.type === 'array') {
                  // For arrays, encode each element
                  return structuredValue.map((item: any, index: number) => {
                    const encodedElement: any[] = encodeValues(p.components!).map((_: any, compIndex: number) => {
                      const componentValue = item[compIndex]
                      if (componentValue === undefined) {
                        throw new Error(`Missing element ${compIndex} in array ${p.name}`)
                      }
                      return encodeSingleValue(p.components![compIndex], componentValue)
                    })
                    return encodedElement
                  })
                } else {
                  // For tuples, encode as array of values
                  return encodeValues(p.components).map((_: any, compIndex: number) => {
                    const componentValue = structuredValue[p.components![compIndex].name]
                    if (componentValue === undefined) {
                      throw new Error(`Missing component ${p.components![compIndex].name} in tuple ${p.name}`)
                    }
                    return encodeSingleValue(p.components![compIndex], componentValue)
                  })
                }
              }
            } catch (error) {
              throw new Error(`Invalid ${p.type === 'array' ? 'array' : 'tuple'} format for parameter ${p.name}: ${error instanceof Error ? error.message : String(error)}`)
            }
          }


          return encodeSingleValue(p, value)
        })
      }

      // Helper function to encode a single value
      const encodeSingleValue = (param: Parameter, value: any) => {
        const stringValue = String(value).trim()

        switch (param.type) {
          case 'address':
            if (!isAddress(stringValue)) {
              throw new Error(`Invalid address format for parameter ${param.name}`)
            }
            return stringValue as Address
          case 'uint256':
          case 'uint':
          case 'uint8':
          case 'uint16':
          case 'uint32':
          case 'uint64':
          case 'uint128':
            return BigInt(stringValue)
          case 'int256':
          case 'int':
          case 'int8':
          case 'int16':
          case 'int32':
          case 'int64':
          case 'int128':
            return BigInt(stringValue)
          case 'bool':
            return stringValue === 'true'
          case 'string':
          case 'bytes':
          case 'bytes32':
          case 'bytes16':
          case 'bytes8':
          case 'bytes4':
          case 'bytes2':
          case 'bytes1':
            return stringValue
          default:
            return stringValue
        }
      }

      // Prepare values for encoding
      const values = encodeValues(transactionData.parameters)

      // Encode the function data
      const encodedData = encodeFunctionData({
        abi: [abiItem],
        args: values
      })

      setEncodedData(encodedData)
    } catch (error) {
      console.error('Encoding error:', error)
    } finally {
      setIsEncoding(false)
    }
  }, [transactionData, isAllValid])

  // Send transaction
  const sendTransactionData = useCallback(async () => {
    if (!currentAccount) {
      return
    }

    if (!encodedData) {
      return
    }

    if (!transactionData.targetAddress.trim()) {
      return
    }

    setIsSending(true)

    try {
      // Create transaction object
      const tx = {
        to: transactionData.targetAddress as `0x${string}`,
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
  }, [currentAccount, encodedData, transactionData.targetAddress, sendTransaction])

  // Eth call function
  const callTransaction = useCallback(async () => {
    if (!encodedData) {
      return
    }

    if (!transactionData.targetAddress.trim()) {
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
      // Create call object
      const callData = {
        to: transactionData.targetAddress as `0x${string}`,
        data: encodedData as `0x${string}`,
        value: 0n
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
  }, [encodedData, transactionData.targetAddress, publicClient])

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
              value={transactionData.functionName}
              onChange={(e) => updateFunctionName(e.target.value)}
              placeholder="e.g., transfer, approve, mint"
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:border-transparent ${
                transactionData.functionName.trim()
                  ? validationState.functionName.isValid
                    ? 'border-green-300 focus:ring-green-500'
                    : 'border-red-300 focus:ring-red-500'
                  : 'border-gray-300 focus:ring-blue-500'
              }`}
            />
            {transactionData.functionName.trim() && !validationState.functionName.isValid && (
              <p className="mt-1 text-sm text-red-600">{validationState.functionName.message}</p>
            )}
          </div>
        </div>
      </Card>

      {/* Parameters */}
      <Card title="Function Parameters" subtitle="Add and configure function parameters">
        <div className="space-y-4">
                      {/* Column headers - only show when there are parameters */}
            {transactionData.parameters.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 px-4">
                <div className="text-sm font-medium text-gray-700 text-center">Depth</div>
                <div className="text-sm font-medium text-gray-700 md:col-span-2">Name</div>
                <div className="text-sm font-medium text-gray-700 md:col-span-2">Type</div>
                <div className="text-sm font-medium text-gray-700 md:col-span-6">Value</div>
                <div className="text-sm font-medium text-gray-700 text-center">Delete</div>
              </div>
            )}

          {/* Flatten parameters and their tuple components for rendering */}
          {(() => {
            const flattenedRows: Array<{
              parameter: Parameter
              depth: number
              parentId?: string
              isTupleComponent: boolean
            }> = []

            const addParameterWithComponents = (param: Parameter, depth: number = 0, parentId?: string) => {
              // Add the main parameter
              flattenedRows.push({
                parameter: param,
                depth,
                parentId,
                isTupleComponent: depth > 0
              })

              // Add tuple components if this is a tuple
              if (param.type === 'tuple' && param.components) {
                param.components.forEach(component => {
                  addParameterWithComponents(component, depth + 1, param.id)
                })
              }

              // Add array components if this is an array (treat arrays like tuples)
              if (isStructuredType(param.type) && param.components) {
                param.components.forEach(component => {
                  addParameterWithComponents(component, depth + 1, param.id)
                })
              }
            }

            transactionData.parameters.forEach(param => {
              addParameterWithComponents(param)
            })

            return flattenedRows.map(({ parameter, depth, parentId, isTupleComponent }) => (
              <ParameterInput
                key={parameter.id}
                parameter={parameter}
                depth={depth}
                parentId={parentId}
                isTupleComponent={isTupleComponent}
                validation={validationState.parameters[parameter.id]}
                onUpdate={(field, value) => updateParameter(parameter.id, field, value)}
                onRemove={() => removeParameter(parameter.id)}
                onAddComponent={() => addComponentTo(parameter.id)}
              />
            ))
          })()}

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
              <div className="bg-gray-100 p-3 rounded-md">
                <div className="flex justify-between items-center mb-1">
                  <div className="text-sm font-medium text-gray-700">Encoded Data:</div>
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
                <div className="text-xs font-mono text-gray-600 break-all">{encodedData}</div>
              </div>
            )}
          </div>

          {/* Target Address */}
          <div>
            <label htmlFor="targetAddress" className="block text-sm font-medium text-gray-700 mb-2">
              Target Contract Address
            </label>
            <AddressSelector
              value={transactionData.targetAddress}
              onChange={updateTargetAddress}
              placeholder="Select contract address..."
              className={transactionData.targetAddress.trim()
                ? validationState.targetAddress.isValid
                  ? 'border-green-300 focus:ring-green-500'
                  : 'border-red-300 focus:ring-red-500'
                : ''
              }
            />
            {transactionData.targetAddress.trim() && !validationState.targetAddress.isValid && (
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
                disabled={!encodedData || !transactionData.targetAddress.trim() || !validationState.targetAddress.isValid}
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
                disabled={!encodedData || !currentAccount || !transactionData.targetAddress.trim() || !validationState.targetAddress.isValid}
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

      {/* Example Transactions */}
      <ExampleTransactions onLoadExample={loadExample} />
    </div>
  )
})

export default TransactionBuilder
