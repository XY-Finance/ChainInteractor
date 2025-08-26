'use client'

import React, { useState } from 'react'
import { useWalletManager } from '../../hooks/useWalletManager'
import { usePublicClient } from 'wagmi'
import { sepolia } from 'viem/chains'
import { type Address } from 'viem'
import { addresses } from '../../config/addresses'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'

export function WalletOperations() {
  const {
    isConnected,
    currentAccount,
    capabilities,
    isLoading,
    error,
    signMessage,
    sendTransaction,
    sign7702Authorization,
    submit7702Authorization,
    createSmartAccount,
    sendUserOperation,
    clearError
  } = useWalletManager()

  const [message, setMessage] = useState('Hello, EIP-7702!')
  const [signature, setSignature] = useState<string>('')
  const [txHash, setTxHash] = useState<string>('')
  const [authSignature, setAuthSignature] = useState<string>('')
  const [smartAccountAddress, setSmartAccountAddress] = useState<string>('')

  const handleSignMessage = async () => {
    try {
      const sig = await signMessage(message)
      setSignature(sig)
      console.log('Message signed:', sig)
    } catch (err) {
      console.error('Failed to sign message:', err)
    }
  }

  const handleSendTransaction = async () => {
    try {
      // Send a small transaction to self (for testing)
      const hash = await sendTransaction({
        to: currentAccount?.address,
        value: 0n,
        data: '0x'
      })
      setTxHash(hash)
      console.log('Transaction sent:', hash)
    } catch (err) {
      console.error('Failed to send transaction:', err)
    }
  }

  const handleSign7702Auth = async () => {
    try {
      // Create sample EIP-7702 authorization data
      const authorizationData = {
        address: currentAccount?.address,
        chainId: 11155111, // Sepolia
        nonce: 0,
        contractAddress: addresses.common.zero,
        executor: addresses.common.zero
      }

      const sig = await sign7702Authorization(authorizationData)
      setAuthSignature(sig)
      console.log('7702 Authorization signed:', sig)
    } catch (err) {
      console.error('Failed to sign 7702 authorization:', err)
    }
  }

  const handleSubmit7702Auth = async () => {
    if (!authSignature) {
      alert('Please sign a 7702 authorization first')
      return
    }

    try {
      const hash = await submit7702Authorization(authSignature)
      console.log('7702 Authorization submitted:', hash)
    } catch (err) {
      console.error('Failed to submit 7702 authorization:', err)
    }
  }

  const handleCreateSmartAccount = async () => {
    try {
      const address = await createSmartAccount()
      setSmartAccountAddress(address)
      console.log('Smart account created:', address)
    } catch (err) {
      console.error('Failed to create smart account:', err)
    }
  }

  const handleSendUserOperation = async () => {
    try {
      // Create sample user operation
      const userOp = {
        sender: smartAccountAddress || currentAccount?.address,
        nonce: 0,
        initCode: '0x',
        callData: '0x',
        callGasLimit: 0n,
        verificationGasLimit: 0n,
        preVerificationGas: 0n,
        maxFeePerGas: 0n,
        maxPriorityFeePerGas: 0n,
        paymasterAndData: '0x',
        signature: '0x'
      }

      const hash = await sendUserOperation(userOp)
      console.log('User operation sent:', hash)
    } catch (err) {
      console.error('Failed to send user operation:', err)
    }
  }

  if (!isConnected) {
    return (
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Wallet Operations</h2>
        <p className="text-gray-600">Please connect a wallet first to test operations.</p>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-4">Wallet Operations</h2>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-700 text-sm">{error}</p>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearError}
            className="mt-2 text-red-600 hover:text-red-800"
          >
            Dismiss
          </Button>
        </div>
      )}

      <div className="space-y-6">
        {/* Wallet Info */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
          <h3 className="font-medium text-blue-800 mb-2">Connected Wallet</h3>
          <p className="text-sm text-blue-600">Address: {currentAccount?.address}</p>
          <p className="text-sm text-blue-600">Type: {currentAccount?.type}</p>
          {capabilities && (
            <div className="mt-2">
              <p className="text-sm text-blue-600">Capabilities:</p>
              <ul className="text-xs text-blue-600 ml-4 list-disc">
                <li>Sign Messages: {capabilities.canSign ? '✅' : '❌'}</li>
                <li>Send Transactions: {capabilities.canSendTransaction ? '✅' : '❌'}</li>
                <li>Sign 7702 Auth: {capabilities.canSign7702Auth ? '✅' : '❌'}</li>
                <li>Create Smart Account: {capabilities.canCreateSmartAccount ? '✅' : '❌'}</li>
              </ul>
            </div>
          )}
        </div>

        {/* Message Signing */}
        <div className="space-y-3">
          <h3 className="font-medium">Sign Message</h3>
          <div className="flex gap-2">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
              placeholder="Enter message to sign"
            />
            <Button
              onClick={handleSignMessage}
              disabled={isLoading || !capabilities?.canSign}
              size="sm"
            >
              {isLoading ? 'Signing...' : 'Sign'}
            </Button>
          </div>
          {signature && (
            <div className="p-3 bg-gray-50 rounded-md">
              <p className="text-xs text-gray-600">Signature:</p>
              <p className="text-xs font-mono break-all">{signature}</p>
            </div>
          )}
        </div>

        {/* Transaction Sending */}
        <div className="space-y-3">
          <h3 className="font-medium">Send Transaction</h3>
          <Button
            onClick={handleSendTransaction}
            disabled={isLoading || !capabilities?.canSendTransaction}
            variant="outline"
            size="sm"
          >
            {isLoading ? 'Sending...' : 'Send Test Transaction'}
          </Button>
          {txHash && (
            <div className="p-3 bg-gray-50 rounded-md">
              <p className="text-xs text-gray-600">Transaction Hash:</p>
              <p className="text-xs font-mono break-all">{txHash}</p>
            </div>
          )}
        </div>

        {/* EIP-7702 Authorization */}
        <div className="space-y-3">
          <h3 className="font-medium">EIP-7702 Authorization</h3>
          <div className="flex gap-2">
            <Button
              onClick={handleSign7702Auth}
              disabled={isLoading || !capabilities?.canSign7702Auth}
              size="sm"
            >
              {isLoading ? 'Signing...' : 'Sign Authorization'}
            </Button>
            <Button
              onClick={handleSubmit7702Auth}
              disabled={isLoading || !authSignature}
              variant="outline"
              size="sm"
            >
              {isLoading ? 'Submitting...' : 'Submit Authorization'}
            </Button>
          </div>
          {authSignature && (
            <div className="p-3 bg-gray-50 rounded-md">
              <p className="text-xs text-gray-600">Authorization Signature:</p>
              <p className="text-xs font-mono break-all">{authSignature}</p>
            </div>
          )}
        </div>

        {/* Smart Account Operations */}
        <div className="space-y-3">
          <h3 className="font-medium">Smart Account Operations</h3>
          <div className="flex gap-2">
            <Button
              onClick={handleCreateSmartAccount}
              disabled={isLoading || !capabilities?.canCreateSmartAccount}
              size="sm"
            >
              {isLoading ? 'Creating...' : 'Create Smart Account'}
            </Button>
            <Button
              onClick={handleSendUserOperation}
              disabled={isLoading || !smartAccountAddress}
              variant="outline"
              size="sm"
            >
              {isLoading ? 'Sending...' : 'Send User Operation'}
            </Button>
          </div>
          {smartAccountAddress && (
            <div className="p-3 bg-gray-50 rounded-md">
              <p className="text-xs text-gray-600">Smart Account Address:</p>
              <p className="text-xs font-mono break-all">{smartAccountAddress}</p>
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}
