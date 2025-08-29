'use client'

import React, { useState, useCallback } from 'react'
import { Card } from '../../../components/ui/Card'
import { Button } from '../../../components/ui/Button'
import { useWalletManager } from '../../../hooks/useWalletManager'
import { encodeFunctionData, parseAbiItem, type Address, isAddress } from 'viem'
import ParameterInput from './ParameterInput'
import TransactionPreview from './TransactionPreview'
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

interface TransactionBuilderProps {
  addLog: (message: string) => void
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
    if (!transactionData.functionName.trim()) {
      addLog('❌ Function name is required')
      return
    }

    if (!transactionData.targetAddress.trim()) {
      addLog('❌ Target contract address is required')
      return
    }

    if (!isAddress(transactionData.targetAddress)) {
      addLog('❌ Invalid Ethereum address format')
      return
    }

    if (transactionData.parameters.some(p => !p.name.trim() || !p.value.trim())) {
      addLog('❌ All parameters must have names and values')
      return
    }

    setIsEncoding(true)
    addLog('🔧 Encoding function data...')

    try {
      // Build function signature
      const paramTypes = transactionData.parameters.map(p => p.type).join(',')
      const functionSignature = `${transactionData.functionName}(${paramTypes})`

      // Parse ABI item
      const abiItem = parseAbiItem(functionSignature)

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

      setTransactionData(prev => ({
        ...prev,
        encodedData
      }))

      addLog(`✅ Function encoded successfully: ${encodedData}`)
    } catch (error) {
      addLog(`❌ Failed to encode function: ${error}`)
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </Card>

      {/* Parameters */}
      <Card title="Function Parameters" subtitle="Add and configure function parameters">
        <div className="space-y-4">
          {transactionData.parameters.map((parameter) => (
            <ParameterInput
              key={parameter.id}
              parameter={parameter}
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              onClick={encodeData}
              loading={isEncoding}
              disabled={!transactionData.functionName.trim() || !transactionData.targetAddress.trim()}
              className="w-full"
            >
              🔧 Encode Data
            </Button>

            <Button
              onClick={sendTransactionData}
              loading={isSending}
              disabled={!transactionData.encodedData || !currentAccount}
              variant="success"
              className="w-full"
            >
              📤 Send Transaction
            </Button>
          </div>
        </div>
      </Card>

      {/* Transaction Preview */}
      {(transactionData.encodedData || transactionData.txHash) && (
        <TransactionPreview transactionData={transactionData} />
      )}

      {/* Example Transactions */}
      <ExampleTransactions onLoadExample={loadExample} />
    </div>
  )
})

export default TransactionBuilder
