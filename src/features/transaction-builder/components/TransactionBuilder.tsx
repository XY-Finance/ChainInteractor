'use client'

import React, { useState, useCallback, useMemo } from 'react'
import { Card } from '../../../components/ui/Card'
import { Button } from '../../../components/ui/Button'
import { useWalletManager } from '../../../hooks/useWalletManager'
import { encodeFunctionData, type Address, isAddress } from 'viem'
import ParameterInput from './ParameterInput'
// import TransactionPreview from './TransactionPreview'
import ExampleTransactions from './ExampleTransactions'

export interface Parameter {
  id: string
  name: string
  type: string
  value: string
}

export interface TransactionData {
  functionName: string
  targetAddress: string
  parameters: Parameter[]
  encodedData?: string
  txHash?: string
}

interface ValidationState {
  functionName: { isValid: boolean; message: string }
  targetAddress: { isValid: boolean; message: string }
  parameters: { [id: string]: { isValid: boolean; message: string } }
}

interface TransactionBuilderProps {
  addLog: (message: string) => void
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
  }

  return { isValid: true, message: '' }
}

const TransactionBuilder = React.memo(function TransactionBuilder({ addLog }: TransactionBuilderProps) {
  const { currentAccount, sendTransaction } = useWalletManager()

  const [transactionData, setTransactionData] = useState<TransactionData>({
    functionName: '',
    targetAddress: '',
    parameters: []
  })

  const [isEncoding, setIsEncoding] = useState(false)
  const [isSending, setIsSending] = useState(false)

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

    addLog('➕ Added new parameter field')
  }, [addLog])

  // Remove a parameter
  const removeParameter = useCallback((id: string) => {
    setTransactionData(prev => ({
      ...prev,
      parameters: prev.parameters.filter(p => p.id !== id)
    }))

    addLog('➖ Removed parameter field')
  }, [addLog])

  // Update parameter
  const updateParameter = useCallback((id: string, field: keyof Parameter, value: string) => {
    setTransactionData(prev => ({
      ...prev,
      parameters: prev.parameters.map(p =>
        p.id === id ? { ...p, [field]: value } : p
      )
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

    addLog(`📋 Loaded example: ${example.name}`)
  }, [addLog])

  // Encode function data
  const encodeData = useCallback(async () => {
    console.log('🔧 Encode function called!')
    console.log('Current transactionData:', transactionData)

    if (!isAllValid) {
      addLog('❌ Please fix all validation errors before encoding')
      return
    }

    setIsEncoding(true)
    addLog('🔧 Encoding function data...')

    try {
      // Create ABI item object
      const abiItem = {
        inputs: transactionData.parameters.map(p => ({
          name: p.name,
          type: p.type
        })),
        name: transactionData.functionName,
        outputs: [], // TODO: We'll assume no outputs for now, can be enhanced later
        stateMutability: 'nonpayable', // TODO: Default to nonpayable, can be enhanced later
        type: 'function'
      }

      console.log('ABI item:', abiItem)
      console.log('transactionData', transactionData)

      // Prepare values for encoding
      const values = transactionData.parameters.map(p => {
        const value = p.value.trim()

        // Handle different types
        switch (p.type) {
          case 'address':
            if (!isAddress(value)) {
              throw new Error(`Invalid address format for parameter ${p.name}`)
            }
            return value as Address
          case 'uint256':
          case 'uint':
          case 'uint8':
          case 'uint16':
          case 'uint32':
          case 'uint64':
          case 'uint128':
            return BigInt(value)
          case 'int256':
          case 'int':
          case 'int8':
          case 'int16':
          case 'int32':
          case 'int64':
          case 'int128':
            return BigInt(value)
          case 'bool':
            return value === 'true'
          case 'string':
          case 'bytes':
          default:
            return value
        }
      })

      // Encode the function data
      const encodedData = encodeFunctionData({
        abi: [abiItem],
        args: values
      })
      console.log('encodedData', encodedData)

      setTransactionData(prev => ({
        ...prev,
        encodedData
      }))

      addLog(`✅ Function encoded successfully: ${encodedData}`)
    } catch (error) {
      console.error('Encoding error:', error)
      addLog(`❌ Failed to encode function: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setIsEncoding(false)
    }
  }, [transactionData, addLog])

  // Send transaction
  const sendTransactionData = useCallback(async () => {
    if (!currentAccount) {
      addLog('❌ No wallet connected')
      return
    }

    if (!transactionData.encodedData) {
      addLog('❌ Please encode the function data first')
      return
    }

    if (!transactionData.targetAddress.trim()) {
      addLog('❌ Target contract address is required')
      return
    }

    setIsSending(true)
    addLog('📤 Sending transaction...')

    try {
      // Create transaction object
      const tx = {
        to: transactionData.targetAddress as `0x${string}`,
        data: transactionData.encodedData,
        value: 0n
      }

      const txHash = await sendTransaction(tx)

      setTransactionData(prev => ({
        ...prev,
        txHash
      }))

      addLog(`✅ Transaction sent successfully: ${txHash}`)
    } catch (error) {
      addLog(`❌ Failed to send transaction: ${error}`)
    } finally {
      setIsSending(false)
    }
  }, [currentAccount, transactionData.encodedData, transactionData.targetAddress, sendTransaction, addLog])



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
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4 px-4">
              <div className="text-sm font-medium text-gray-700">Name</div>
              <div className="text-sm font-medium text-gray-700">Type</div>
              <div className="text-sm font-medium text-gray-700 md:col-span-3">Value</div>
              <div className="text-sm font-medium text-gray-700 text-center">Action</div>
            </div>
          )}

          {transactionData.parameters.map((parameter) => (
            <ParameterInput
              key={parameter.id}
              parameter={parameter}
              validation={validationState.parameters[parameter.id]}
              onUpdate={(field, value) => updateParameter(parameter.id, field, value)}
              onRemove={() => removeParameter(parameter.id)}
            />
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
      <Card title="Transaction Actions" subtitle="Encode and send your transaction">
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <Button
              onClick={encodeData}
              loading={isEncoding}
              disabled={!isAllValid}
              className="w-full"
            >
              🔧 Encode Data {!isAllValid ? '(Fix validation errors)' : ''}
            </Button>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="targetAddress" className="block text-sm font-medium text-gray-700 mb-2">
                  Target Contract Address
                </label>
                <input
                  id="targetAddress"
                  type="text"
                  value={transactionData.targetAddress}
                  onChange={(e) => updateTargetAddress(e.target.value)}
                  placeholder="0x..."
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:border-transparent ${
                    transactionData.targetAddress.trim()
                      ? validationState.targetAddress.isValid
                        ? 'border-green-300 focus:ring-green-500'
                        : 'border-red-300 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-blue-500'
                  }`}
                />
                {transactionData.targetAddress.trim() && !validationState.targetAddress.isValid && (
                  <p className="mt-1 text-sm text-red-600">{validationState.targetAddress.message}</p>
                )}
              </div>

              <div className="flex items-end">
                <Button
                  onClick={sendTransactionData}
                  loading={isSending}
                  disabled={!transactionData.encodedData || !currentAccount || !transactionData.targetAddress.trim() || !validationState.targetAddress.isValid}
                  variant="success"
                  className="w-full"
                >
                  📤 Send Transaction
                </Button>
              </div>
            </div>

            <Button
              onClick={() => {
                console.log('Test button clicked!')
                addLog('🧪 Test button clicked!')
              }}
              variant="outline"
              className="w-full"
            >
              🧪 Test Button
            </Button>
          </div>
        </div>
      </Card>

      {/* Transaction Preview */}
      {(transactionData.encodedData || transactionData.txHash) && (
        <div>Transaction Preview (temporarily disabled)</div>
      )}

      {/* Example Transactions */}
      <ExampleTransactions onLoadExample={loadExample} />
    </div>
  )
})

export default TransactionBuilder
