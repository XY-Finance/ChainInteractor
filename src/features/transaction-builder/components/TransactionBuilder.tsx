'use client'

import React, { useState, useCallback, useMemo } from 'react'
import { Card } from '../../../components/ui/Card'
import { Button } from '../../../components/ui/Button'
import { AddressSelector } from '../../../components/ui'
import { useWalletManager } from '../../../hooks/useWalletManager'
import { encodeFunctionData, type Address, isAddress } from 'viem'
import ParameterInput from './ParameterInput'
import ExampleTransactions from './ExampleTransactions'

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

const validateParameter = (parameter: Parameter): { isValid: boolean; message: string } => {
  if (!parameter.value.trim()) {
    return { isValid: false, message: 'Parameter value is required' }
  }

  // Type-specific validation
  const value = parameter.value.trim()
  switch (parameter.type) {
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
    case 'tuple':
      if (parameter.components && parameter.components.length > 0) {
        try {
          const tupleValue = JSON.parse(value)
          // Validate each component
          for (const component of parameter.components) {
            if (!(component.name in tupleValue)) {
              return { isValid: false, message: `Missing component: ${component.name}` }
            }
            const componentValidation = validateParameter({
              ...component,
              value: String(tupleValue[component.name])
            })
            if (!componentValidation.isValid) {
              return { isValid: false, message: `Invalid ${component.name}: ${componentValidation.message}` }
            }
          }
        } catch (error) {
          return { isValid: false, message: 'Invalid JSON format for tuple' }
        }
      } else {
        return { isValid: false, message: 'Tuple must have components defined' }
      }
      break
  }

  return { isValid: true, message: '' }
}

const TransactionBuilder = React.memo(function TransactionBuilder() {
  const { currentAccount, sendTransaction } = useWalletManager()

  const [transactionData, setTransactionData] = useState<TransactionData>({
    functionName: '',
    targetAddress: '',
    parameters: []
  })

  const [isEncoding, setIsEncoding] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [isCalling, setIsCalling] = useState(false)

  // Local state for displaying results
  const [encodedData, setEncodedData] = useState<string>('')
  const [transactionHash, setTransactionHash] = useState<string>('')
  const [callResult, setCallResult] = useState<string>('')

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

  // Add a new tuple component (recursive function to handle nested tuples)
  const addTupleComponent = useCallback((parameterId: string) => {
    setTransactionData(prev => ({
      ...prev,
      parameters: prev.parameters.map(param => {
        // If this is the target parameter (top level)
        if (param.id === parameterId) {
          const newComponent: Parameter = {
            id: Date.now().toString() + Math.random(),
            name: '',
            type: 'address',
            value: ''
          }
          const updatedComponents = [...(param.components || []), newComponent]
          return {
            ...param,
            components: updatedComponents
          }
        }

        // If this parameter has tuple components, search recursively
        if (param.type === 'tuple' && param.components) {
          const addComponentsRecursive = (components: Parameter[]): Parameter[] => {
            return components.map(comp => {
              if (comp.id === parameterId) {
                const newComponent: Parameter = {
                  id: Date.now().toString() + Math.random(),
                  name: '',
                  type: 'address',
                  value: ''
                }
                return { ...comp, components: [...(comp.components || []), newComponent] }
              }

              if (comp.type === 'tuple' && comp.components) {
                return { ...comp, components: addComponentsRecursive(comp.components) }
              }

              return comp
            })
          }

          return { ...param, components: addComponentsRecursive(param.components) }
        }

        return param
      })
    }))
  }, [])

  // Remove a parameter (recursive function to handle tuple components at any depth)
  const removeParameter = useCallback((id: string, parentId?: string) => {
    setTransactionData(prev => ({
      ...prev,
      parameters: prev.parameters.map(p => {
        // If this is the target parameter (top level)
        if (p.id === id) {
          return null // This will be filtered out
        }

        // If this parameter has tuple components, search recursively
        if (p.type === 'tuple' && p.components) {
          const removeComponentsRecursive = (components: Parameter[]): Parameter[] => {
            return components.filter(comp => {
              if (comp.id === id) {
                return false // Remove this component
              }

              if (comp.type === 'tuple' && comp.components) {
                return { ...comp, components: removeComponentsRecursive(comp.components) }
              }

              return true
            })
          }

          return { ...p, components: removeComponentsRecursive(p.components) }
        }

        return p
      }).filter(Boolean) as Parameter[] // Remove null values
    }))
  }, [])

  // Update parameter (recursive function to handle tuple components at any depth)
  const updateParameter = useCallback((id: string, field: keyof Parameter, value: string, parentId?: string) => {
    setTransactionData(prev => ({
      ...prev,
      parameters: prev.parameters.map(p => {
        // If this is the target parameter (top level)
        if (p.id === id) {
          if (field === 'components') {
            // Handle tuple components update
            try {
              const components = JSON.parse(value)
              return { ...p, components }
            } catch {
              return p
            }
          }

          // Initialize tuple components when type is changed to 'tuple'
          if (field === 'type' && value === 'tuple' && !p.components) {
            return { ...p, [field]: value, components: [] }
          }

          return { ...p, [field]: value }
        }

        // If this parameter has tuple components, search recursively
        if (p.type === 'tuple' && p.components) {
          const updateComponentsRecursive = (components: Parameter[]): Parameter[] => {
            return components.map(comp => {
              if (comp.id === id) {
                if (field === 'type' && value === 'tuple' && !comp.components) {
                  return { ...comp, [field]: value, components: [] }
                }
                return { ...comp, [field]: value }
              }

              if (comp.type === 'tuple' && comp.components) {
                return { ...comp, components: updateComponentsRecursive(comp.components) }
              }

              return comp
            })
          }

          return { ...p, components: updateComponentsRecursive(p.components) }
        }

        return p
      })
    }))
  }, [])

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
    console.log('🔧 Encode function called!')
    console.log('Current transactionData:', transactionData)

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

      console.log('ABI item:', abiItem)
      console.log('transactionData', transactionData)

      // Recursive function to encode values with tuple support
      const encodeValues = (params: Parameter[]): any[] => {
        return params.map(p => {
          const value = p.value.trim()

          // Handle tuple types
          if (p.type === 'tuple' && p.components && p.components.length > 0) {
            // For tuples, we need to parse the JSON value and encode each component
            try {
              const tupleValue = JSON.parse(value)
              const encodedTuple: any[] = encodeValues(p.components).map((_: any, index: number) => {
                const componentValue = tupleValue[p.components![index].name]
                if (componentValue === undefined) {
                  throw new Error(`Missing component ${p.components![index].name} in tuple ${p.name}`)
                }
                return encodeSingleValue(p.components![index], componentValue)
              })
              return encodedTuple
            } catch (error) {
              throw new Error(`Invalid tuple format for parameter ${p.name}: ${error instanceof Error ? error.message : String(error)}`)
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
      console.log('encodedData', encodedData)

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

    setIsCalling(true)

    try {
      // Create call object
      const callData = {
        to: transactionData.targetAddress as `0x${string}`,
        data: encodedData,
        value: 0n
      }

      // TODO: Implement actual eth_call using wallet provider
      // For now, we'll simulate a call result
      const result = `0x0000000000000000000000000000000000000000000000000000000000000001` // Mock result
      setCallResult(result)
    } catch (error) {
      setCallResult(`Error: ${error}`)
    } finally {
      setIsCalling(false)
    }
  }, [encodedData, transactionData.targetAddress])

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
                onAddTupleComponent={() => addTupleComponent(parameter.id)}
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
      <Card title="Transaction Actions" subtitle="Encode and execute your transaction">
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
                <div className="text-sm font-medium text-gray-700 mb-1">Encoded Data:</div>
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
                <div className="bg-blue-50 p-3 rounded-md">
                  <div className="text-sm font-medium text-blue-700 mb-1">Call Result:</div>
                  <div className="text-xs font-mono text-blue-600 break-all">{callResult}</div>
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
                  <div className="text-sm font-medium text-green-700 mb-1">Transaction Hash:</div>
                  <div className="text-xs font-mono text-green-600 break-all">{transactionHash}</div>
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
