'use client'

import { useState, useEffect } from 'react'
import { usePublicClient } from 'wagmi'
import { useWalletManager } from '../../hooks/useWalletManager'
import {
  createPublicClient,
  createWalletClient,
  http,
  zeroAddress,
  parseEther,
  type Hex,
  type Address
} from 'viem'
import { sepolia } from 'viem/chains'
import { createBundlerClient } from 'viem/account-abstraction'
import {
  Implementation,
  toMetaMaskSmartAccount,
  getDeleGatorEnvironment,
} from '@metamask/delegation-toolkit'

interface DelegateeContract {
  name: string
  address: Address
  description: string
  implementation: Implementation
}

const DELEGATEE_CONTRACTS: DelegateeContract[] = [
  {
    name: 'MetaMask deleGator Core',
    address: '0x0000000000000000000000000000000000000000', // Will be set dynamically
    description: 'Core MetaMask deleGator implementation for EIP-7702',
    implementation: Implementation.Stateless7702
  }
]

export default function EIP7702Page() {
  const { isConnected, currentAccount, signMessage } = useWalletManager()
  const publicClient = usePublicClient()

  const address = currentAccount?.address

  const [selectedContract, setSelectedContract] = useState<DelegateeContract | null>(null)
  const [authorizationHash, setAuthorizationHash] = useState<any>(null)
  const [signedAuthorization, setSignedAuthorization] = useState<any>(null)
  const [isAuthorizing, setIsAuthorizing] = useState(false)
  const [isSigning, setIsSigning] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [transactionHash, setTransactionHash] = useState<string>('')
  const [smartAccountAddress, setSmartAccountAddress] = useState<string>('')
  const [userOpHash, setUserOpHash] = useState<string>('')
  const [isSendingUserOp, setIsSendingUserOp] = useState(false)
  const [recipientAddress, setRecipientAddress] = useState('')
  const [amount, setAmount] = useState('')
  const [logs, setLogs] = useState<string[]>([])

  // Initialize delegatee contracts with actual addresses
  useEffect(() => {
    const initializeContracts = async () => {
      if (!publicClient) return

      try {
        const environment = getDeleGatorEnvironment(sepolia.id)
        const contractAddress = environment.implementations.EIP7702StatelessDeleGatorImpl

        DELEGATEE_CONTRACTS[0].address = contractAddress

        addLog(`✅ Initialized delegatee contracts`)
        addLog(`📋 MetaMask deleGator Core: ${contractAddress}`)
      } catch (error) {
        addLog(`❌ Error initializing contracts: ${error}`)
      }
    }

    initializeContracts()
  }, [publicClient])

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  const authorize7702 = async () => {
    if (!isConnected || !currentAccount) {
      addLog('❌ Please connect your wallet first')
      return
    }

    if (!selectedContract || !address || !publicClient) {
      addLog('❌ Selected contract, address, or public client not available')
      addLog(`   - Wallet connected: ${isConnected}`)
      addLog(`   - Address: ${address}`)
      addLog(`   - Selected contract: ${selectedContract ? 'yes' : 'no'}`)
      addLog(`   - Public client: ${publicClient ? 'yes' : 'no'}`)
      return
    }

    setIsAuthorizing(true)
    addLog('🔐 Starting EIP-7702 authorization...')

    try {
      // Get current nonce for the account
      const nonce = await publicClient.getTransactionCount({ address })
      addLog(`📊 Current nonce: ${nonce}`)

      // Create authorization data structure
      const authorizationData = {
        address: address as `0x${string}`,
        chainId: sepolia.id,
        nonce: nonce,
        contractAddress: selectedContract.address,
        executor: 'self' as const,
      }

      addLog(`📝 Authorization data structure:`)
      addLog(`   - Address: ${authorizationData.address}`)
      addLog(`   - Chain ID: ${authorizationData.chainId}`)
      addLog(`   - Nonce: ${authorizationData.nonce}`)
      addLog(`   - Contract: ${authorizationData.contractAddress}`)
      addLog(`   - Executor: ${authorizationData.executor}`)

      // Store the authorization data
      setAuthorizationHash(authorizationData)
      addLog('✅ Authorization data prepared successfully')
      addLog('📝 Ready to sign authorization')
    } catch (error) {
      addLog(`❌ Authorization failed: ${error}`)
    } finally {
      setIsAuthorizing(false)
    }
  }

  const signAuthorization = async () => {
    if (!authorizationHash || !address) {
      addLog('❌ Authorization data or address not available')
      return
    }

    setIsSigning(true)
    addLog('✍️ Signing authorization with connected wallet...')

    try {
      // Use our wallet system's signMessage method
      const messageToSign = JSON.stringify(authorizationHash)
      const signature = await signMessage(messageToSign)

      setSignedAuthorization(signature)
      addLog('✅ Authorization signed successfully')
      addLog(`📝 Signature: ${signature}`)
    } catch (error) {
      addLog(`❌ Signing failed: ${error}`)
    } finally {
      setIsSigning(false)
    }
  }

  const submitAuthorization = async () => {
    if (!signedAuthorization) {
      addLog('❌ Signed authorization not available')
      return
    }

    addLog('📤 Authorization submission not yet implemented')
    addLog('💡 This feature will be available in a future update')
  }

  const createSmartAccount = async () => {
    if (!publicClient || !address) {
      addLog('❌ Public client or address not available')
      return
    }

    addLog('🏗️ Smart Account creation not yet implemented')
    addLog('💡 This feature will be available in a future update')
  }

  const sendUserOperation = async () => {
    if (!recipientAddress || !amount) {
      addLog('❌ Recipient address or amount not provided')
      return
    }

    addLog('📤 User operation sending not yet implemented')
    addLog('💡 This feature will be available in a future update')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            EIP-7702 Authorization Dashboard
          </h1>
          <p className="text-xl text-gray-600">
            Authorize your EOA to support MetaMask Smart Accounts
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Based on MetaMask Delegation Toolkit
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          {!isConnected ? (
            <div className="text-center py-8">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-yellow-900 mb-3">
                  🔗 Connect Your Wallet First
                </h3>
                <p className="text-yellow-800 text-sm mb-4">
                  Please go to the <strong>Modular Wallet System</strong> tab and connect your wallet first.
                </p>
                <a
                  href="/"
                  className="inline-flex items-center px-4 py-2 bg-yellow-600 text-white font-medium rounded-md hover:bg-yellow-700 transition-colors"
                >
                  Go to Wallet System
                </a>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Account Information */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Connected Account
                </h3>
                <p className="text-sm text-gray-600 font-mono break-all">
                  {address}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Type: {currentAccount?.type}
                </p>
              </div>

              {/* Delegatee Contract Selection */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Select Delegatee Contract
                </h3>
                <div className="grid gap-4">
                  {DELEGATEE_CONTRACTS.map((contract, index) => (
                    <div
                      key={index}
                      className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                        selectedContract?.name === contract.name
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedContract(contract)}
                    >
                      <h4 className="font-semibold text-gray-900">{contract.name}</h4>
                      <p className="text-sm text-gray-600 mt-1">{contract.description}</p>
                      <p className="text-xs text-gray-500 font-mono mt-2 break-all">
                        {contract.address}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Authorization Section */}
              {selectedContract && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    EIP-7702 Authorization Workflow
                  </h3>
                  <div className="flex gap-4 flex-wrap">
                    <button
                      onClick={authorize7702}
                      disabled={isAuthorizing}
                      className="bg-blue-600 text-white px-6 py-2 rounded-md font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                    >
                      {isAuthorizing ? 'Preparing...' : 'Prepare Authorization Data'}
                    </button>
                    {authorizationHash && (
                      <button
                        onClick={signAuthorization}
                        disabled={isSigning}
                        className="bg-purple-600 text-white px-6 py-2 rounded-md font-medium hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                      >
                        {isSigning ? 'Signing...' : 'Sign Authorization'}
                      </button>
                    )}
                    {signedAuthorization && (
                      <button
                        onClick={submitAuthorization}
                        disabled={isSubmitting}
                        className="bg-green-600 text-white px-6 py-2 rounded-md font-medium hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                      >
                        {isSubmitting ? 'Submitting...' : 'Send Authorization'}
                      </button>
                    )}
                  </div>
                  {authorizationHash && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="text-sm font-semibold text-blue-900 mb-2">
                        Authorization Data Structure
                      </h4>
                      <pre className="text-xs text-blue-800 overflow-x-auto">
                        {JSON.stringify(authorizationHash, null, 2)}
                      </pre>
                    </div>
                  )}
                  {signedAuthorization && (
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                      <h4 className="text-sm font-semibold text-purple-900 mb-2">
                        Signed Authorization
                      </h4>
                      <p className="text-xs text-purple-800 font-mono break-all">
                        {signedAuthorization}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Smart Account Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Smart Account Operations
                </h3>
                <div className="flex gap-4 flex-wrap">
                  <button
                    onClick={createSmartAccount}
                    className="bg-indigo-600 text-white px-6 py-2 rounded-md font-medium hover:bg-indigo-700 transition-colors"
                  >
                    Create Smart Account
                  </button>
                </div>
                {smartAccountAddress && (
                  <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-indigo-900 mb-2">
                      Smart Account Address
                    </h4>
                    <p className="text-xs text-indigo-800 font-mono break-all">
                      {smartAccountAddress}
                    </p>
                  </div>
                )}
              </div>

              {/* User Operation Section */}
              {smartAccountAddress && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Send User Operation
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Recipient Address
                      </label>
                      <input
                        type="text"
                        value={recipientAddress}
                        onChange={(e) => setRecipientAddress(e.target.value)}
                        placeholder="0x..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Amount (ETH)
                      </label>
                      <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.01"
                        step="0.001"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>
                  <button
                    onClick={sendUserOperation}
                    disabled={isSendingUserOp || !recipientAddress || !amount}
                    className="bg-indigo-600 text-white px-6 py-2 rounded-md font-medium hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    {isSendingUserOp ? 'Sending...' : 'Send User Operation'}
                  </button>
                  {userOpHash && (
                    <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                      <h4 className="text-sm font-semibold text-indigo-900 mb-2">
                        User Operation Hash
                      </h4>
                      <p className="text-xs text-indigo-700 font-mono break-all">
                        {userOpHash}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Logs Section */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Operation Logs
          </h2>
          <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm h-64 overflow-y-auto">
            {logs.length === 0 ? (
              <p className="text-gray-500">No logs yet. Connect your wallet to get started.</p>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="mb-1">
                  {log}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Information Section */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            About EIP-7702
          </h2>
          <div className="prose prose-gray max-w-none">
            <p className="text-gray-600 mb-4">
              EIP-7702 enables your externally owned account (EOA) to support MetaMask Smart Accounts
              functionality using an EIP-7702 transaction. This allows your EOA to leverage the benefits
              of account abstraction, such as batch transactions, gas sponsorship, and ERC-7710 delegation capabilities.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">How it works:</h3>
              <ol className="list-decimal list-inside space-y-2 text-blue-800">
                <li>Select a delegatee contract (like MetaMask deleGator Core)</li>
                <li>Authorize your EOA to use the contract's functionality</li>
                <li>Submit the authorization transaction to the blockchain</li>
                <li>Create a MetaMask Smart Account instance</li>
                <li>Send user operations through your upgraded EOA</li>
              </ol>
            </div>
            <p className="text-gray-600 mt-4">
              This implementation follows the MetaMask Delegation Toolkit documentation and supports
              the EIP7702StatelessDeleGator contract for a lightweight and secure way to upgrade an EOA to a smart account.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
