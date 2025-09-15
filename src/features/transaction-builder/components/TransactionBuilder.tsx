'use client'

import React, { useState, useCallback, useMemo, useEffect } from 'react'
import { Card } from '../../../components/ui/Card'
import { Button } from '../../../components/ui/Button'
import { AddressSelector } from '../../../components/ui'
import { useWalletManager } from '../../../hooks/useWalletManager'
import { encodeFunctionData, isAddress } from 'viem'
import ParameterInput from './ParameterInput'
import ExampleTransactions from './ExampleTransactions'

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
  const [abi, setAbi] = useState<any[]>([])
  const [dataArray, setDataArray] = useState<any[]>([])
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
  }, [functionName, abi, dataArray])

  // Validation state
  const validationState = useMemo((): ValidationState => {
    const functionNameValidation = validateFunctionName(functionName)
    const targetAddressValidation = validateAddress(targetAddress)

    // Validate parameters
    const parametersValidation: { [id: string]: { isValid: boolean; message: string } } = {}

    if (abi.length > 0 && abi[0]?.inputs) {
      abi[0].inputs.forEach((input: any, index: number) => {
        const value = dataArray[index]
        parametersValidation[`param-${index}`] = validateDataValue(input, value)
      })
    }

    return {
      functionName: functionNameValidation,
      targetAddress: targetAddressValidation,
      parameters: parametersValidation
    }
  }, [functionName, targetAddress, abi, dataArray])

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

  // Update dataArray value at specific index
  const updateDataValue = useCallback((index: number, newValue: any) => {
    setDataArray(prev => {
      const newArray = [...prev]
      newArray[index] = newValue
      return newArray
    })
  }, [])

  // Add a new parameter
  const addParameter = useCallback(() => {
    const newInput = {
      name: `param${abi.length > 0 ? abi[0].inputs.length : 0}`,
      type: 'address'
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

    setDataArray(prev => [...prev, ''])
  }, [abi, functionName])

  // Remove a parameter
  const removeParameter = useCallback((index: number) => {
    setAbi(prev => {
      if (prev.length === 0) return prev
      const newAbi = [...prev]
      newAbi[0] = {
        ...newAbi[0],
        inputs: newAbi[0].inputs.filter((_: any, i: number) => i !== index)
      }
      return newAbi
    })

    setDataArray(prev => prev.filter((_, i) => i !== index))
  }, [])

  // Update parameter name
  const updateParameterName = useCallback((index: number, newName: string) => {
    setAbi(prev => {
      if (prev.length === 0) return prev
      const newAbi = [...prev]
      newAbi[0] = {
        ...newAbi[0],
        inputs: newAbi[0].inputs.map((input: any, i: number) =>
          i === index ? { ...input, name: newName } : input
        )
      }
      return newAbi
    })
  }, [])

  // Update parameter type
  const updateParameterType = useCallback((index: number, newType: string) => {
    setAbi(prev => {
      if (prev.length === 0) return prev
      const newAbi = [...prev]
      newAbi[0] = {
        ...newAbi[0],
        inputs: newAbi[0].inputs.map((input: any, i: number) =>
          i === index ? { ...input, type: newType } : input
        )
      }
      return newAbi
    })

    // Reset data value when type changes
    setDataArray(prev => {
      const newArray = [...prev]
      newArray[index] = ''
      return newArray
    })
  }, [])

  // Add tuple component to ABI structure
  const addTupleComponent = useCallback((parameterIndex: number, componentName: string, componentType: string) => {
    setAbi(prev => {
      if (prev.length === 0) return prev
      const newAbi = [...prev]
      if (!newAbi[0].inputs[parameterIndex].components) {
        newAbi[0].inputs[parameterIndex].components = []
      }
      newAbi[0].inputs[parameterIndex].components.push({
        name: componentName,
        type: componentType
      })
      return newAbi
    })
  }, [])

  // Update tuple component type in ABI structure
  const updateTupleComponentType = useCallback((parameterIndex: number, componentName: string, newType: string) => {
    setAbi(prev => {
      if (prev.length === 0) return prev
      const newAbi = [...prev]
      if (newAbi[0].inputs[parameterIndex].components) {
        newAbi[0].inputs[parameterIndex].components = newAbi[0].inputs[parameterIndex].components.map((comp: any) =>
          comp.name === componentName ? { ...comp, type: newType } : comp
        )
      }
      return newAbi
    })
  }, [])

  // Remove tuple component from ABI structure
  const removeTupleComponent = useCallback((parameterIndex: number, componentIndex: number) => {
    setAbi(prev => {
      if (prev.length === 0) return prev
      const newAbi = [...prev]

      if (newAbi[0].inputs[parameterIndex]?.components) {
        newAbi[0].inputs[parameterIndex].components = newAbi[0].inputs[parameterIndex].components.filter((_: any, i: number) =>
          i !== componentIndex
        )
      }
      return newAbi
    })

    // Also remove the corresponding data value
    setDataArray(prev => {
      const newArray = [...prev]

      if (typeof newArray[parameterIndex] === 'object' && newArray[parameterIndex] !== null) {
        const newTuple = { ...newArray[parameterIndex] }
        const componentName = abi[0]?.inputs[parameterIndex]?.components?.[componentIndex]?.name
        if (componentName) {
          delete newTuple[componentName]
        }
        newArray[parameterIndex] = newTuple
      }
      return newArray
    })
  }, [abi])

  // Load example ABI transaction
  const loadExample = useCallback((example: any) => {
    const abiFunction = example.abi[0]

    setFunctionName(abiFunction.name)
    setTargetAddress(example.targetAddress)
    setAbi(example.abi)
    setDataArray(example.data)

    console.log('Loaded ABI example:', { abiFunction, dataArray: example.data })
  }, [])

  // Encode function data using the ABI structure
  const encodeData = useCallback(async () => {
    if (!isAllValid) {
      return
    }

    if (!functionName || !abi[0] || !dataArray.length) {
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
      const validDataArray = dataArray.map((value, index) => {
        const input = abi[0].inputs[index]
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
  }, [functionName, abi, dataArray, isAllValid])

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

      console.log('Eth call from address:', currentAccount.address)

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
            {abi[0]?.inputs && abi[0].inputs.map((input: any, index: number) => (
              <div key={`${input.name}-${index}`} className={`border rounded-lg p-4 ${
                validationState.parameters[`param-${index}`] && !validationState.parameters[`param-${index}`].isValid && dataArray[index]
                  ? 'border-red-300 bg-red-50'
                  : 'border-gray-200 bg-gray-50'
              }`}>
                <ParameterInput
                  abiInput={input}
                  dataValue={dataArray[index]}
                  validation={validationState.parameters[`param-${index}`]}
                  onUpdate={(newValue) => updateDataValue(index, newValue)}
                  onRemove={() => removeParameter(index)}
                  onUpdateName={(newName) => updateParameterName(index, newName)}
                  onUpdateType={(newType) => updateParameterType(index, newType)}
                  onAddTupleComponent={(componentName, componentType) => addTupleComponent(index, componentName, componentType)}
                  onUpdateTupleComponentType={(componentName, newType) => updateTupleComponentType(index, componentName, newType)}
                  onRemoveTupleComponent={(componentIndex) => removeTupleComponent(index, componentIndex)}
                  annotation="1"
                  index={index}
                />
              </div>
            ))}

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
