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
  implementation?: Implementation
}

const DELEGATEE_CONTRACTS: DelegateeContract[] = [
  {
    name: 'MetaMask deleGator Core',
    address: '0x0000000000000000000000000000000000000000', // Will be set dynamically
    description: 'Core MetaMask deleGator implementation for EIP-7702',
    implementation: Implementation.Stateless7702
  },
  {
    name: 'Revoke Authorization',
    address: '0x0000000000000000000000000000000000000000',
    description: 'Remove/revoke EIP-7702 authorization by setting to zero address',
  }
]

export default function EIP7702Page() {
  const { isConnected, currentAccount, signMessage, sign7702Authorization, submit7702Authorization } = useWalletManager()
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
  const [currentDelegation, setCurrentDelegation] = useState<string>('')
  const [isCheckingDelegation, setIsCheckingDelegation] = useState(false)
  const [verificationResult, setVerificationResult] = useState<any>(null)
  const [currentNonce, setCurrentNonce] = useState<number | null>(null)

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

  // Check current delegation status when address changes
  useEffect(() => {
    if (address && publicClient) {
      checkCurrentDelegation()
    }
  }, [address, publicClient])

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

    const checkCurrentDelegation = async () => {
    if (!address || !publicClient) return

    setIsCheckingDelegation(true)
    try {
      // Get the current delegation by checking the contract code at the account address
      const code = await publicClient.getCode({ address: address as Address })
      console.log('🔍 Code:', code)

      if (!code || code === '0x') {
        setCurrentDelegation('0x0000000000000000000000000000000000000000')
        addLog('📋 Current delegation: None (no delegation)')
      } else if (code.startsWith('0xef0100')) {
        // Extract the contract address by trimming the 0xef0100 prefix
        const contractAddress = '0x' + code.slice(8) // Remove '0xef0100' (8 characters)
        setCurrentDelegation(contractAddress)
        addLog(`📋 Current delegation: Contract ${contractAddress}`)
      } else {
        setCurrentDelegation(code)
        addLog(`📋 Current delegation: Unknown contract (${code})`)
      }

      // Also fetch the current transaction count (nonce)
      const nonce = await publicClient.getTransactionCount({ address: address as Address })
      setCurrentNonce(nonce)
      addLog(`📊 Current transaction count (nonce): ${nonce}`)
    } catch (error) {
      addLog(`❌ Error checking delegation: ${error}`)
      setCurrentDelegation('')
      setCurrentNonce(null)
    } finally {
      setIsCheckingDelegation(false)
    }
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

    const isRevocation = selectedContract.address === '0x0000000000000000000000000000000000000000'
    setIsAuthorizing(true)
    addLog(`🔐 Starting EIP-7702 ${isRevocation ? 'revocation' : 'authorization'}...`)

    try {
      // Get current nonce for the account
      const nonce = await publicClient.getTransactionCount({ address })
      addLog(`📊 Current nonce: ${nonce}`)

      // Create authorization data structure
      const authorizationData = {
        address: address as `0x${string}`,
        chainId: sepolia.id,
        contractAddress: selectedContract.address,
        executor: 'self' as const,
      }

      addLog(`📝 ${isRevocation ? 'Revocation' : 'Authorization'} data structure:`)
      addLog(`   - Address: ${authorizationData.address}`)
      addLog(`   - Chain ID: ${authorizationData.chainId}`)
      addLog(`   - Nonce: ${authorizationData.executor == 'self' ? nonce + 1 : nonce}`)
      addLog(`   - Contract: ${authorizationData.contractAddress}`)
      addLog(`   - Executor: ${authorizationData.executor}`)

      // Store the authorization data and clear any existing signed authorization
      setAuthorizationHash(authorizationData)
      setSignedAuthorization(null)
      addLog(`✅ ${isRevocation ? 'Revocation' : 'Authorization'} data prepared successfully`)
      addLog(`📝 Ready to sign ${isRevocation ? 'revocation' : 'authorization'}`)
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

    const isRevocation = authorizationHash.contractAddress === '0x0000000000000000000000000000000000000000'
    setIsSigning(true)
    addLog(`✍️ Creating EIP-7702 ${isRevocation ? 'revocation' : 'authorization'}...`)

    try {
      // Use our wallet system's sign7702Authorization method
      const result = await sign7702Authorization(authorizationHash)

      // Handle both old format (just authorization) and new format (with verification)
      const authorization = result.authorization || result
      const verification = result.verification

      // Store the signed authorization and verification results
      setSignedAuthorization(authorization)
      setVerificationResult(verification)
      setAuthorizationHash(null)

      addLog(`✅ EIP-7702 ${isRevocation ? 'revocation' : 'authorization'} created successfully`)
      addLog(`📝 ${isRevocation ? 'Revocation' : 'Authorization'} structure:`)
      addLog(`   - Signer: ${address}`)
      addLog(`   - Delegated Contract: ${authorization.address}`)
      addLog(`   - Chain ID: ${authorization.chainId}`)
      addLog(`   - Nonce: ${authorization.nonce}`)
      addLog(`   - Signature: r=${authorization.r}, s=${authorization.s}, yParity=${authorization.yParity}`)

      // Log verification results
      if (verification) {
        addLog(`🔍 Authorization verification:`)
        addLog(`   - Signer address: ${verification.signerAddress}`)
        addLog(`   - Recovered address: ${verification.recoveredAddress}`)
        addLog(`   - Addresses match: ${verification.addressesMatch ? '✅ YES' : '❌ NO'}`)
        if (!verification.addressesMatch) {
          addLog(`   - ⚠️  WARNING: Recovered address does not match signer address!`)
        }
      }
    } catch (error) {
      addLog(`❌ EIP-7702 ${isRevocation ? 'revocation' : 'authorization'} failed: ${error}`)
    } finally {
      setIsSigning(false)
    }
  }

  const submitAuthorization = async () => {
    if (!signedAuthorization) {
      addLog('❌ Signed authorization not available')
      return
    }

    const isRevocation = typeof signedAuthorization === 'object' && signedAuthorization.contractAddress === '0x0000000000000000000000000000000000000000'
    setIsSubmitting(true)
    addLog(`📤 Submitting EIP-7702 ${isRevocation ? 'revocation' : 'authorization'} to blockchain...`)

    try {
      // Use our wallet system's submit7702Authorization method
      const hash = await submit7702Authorization(signedAuthorization)

      setTransactionHash(hash)
      addLog(`✅ EIP-7702 ${isRevocation ? 'revocation' : 'authorization'} submitted successfully`)
      addLog(`📝 Transaction hash: ${hash}`)
    } catch (error) {
      addLog(`❌ EIP-7702 ${isRevocation ? 'revocation' : 'authorization'} submission failed: ${error}`)
    } finally {
      setIsSubmitting(false)
    }
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
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          {!isConnected ? (
            <div className="text-center py-12">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 max-w-md mx-auto">
                <h3 className="text-lg font-semibold text-yellow-900 mb-3">
                  🔗 Connect Your Wallet First
                </h3>
                <p className="text-yellow-800 text-sm mb-4">
                  Please connect your wallet using the dropdown in the top right to start using EIP-7702 authorization features.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Current Delegation Status */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-blue-900 mb-2">
                  Current Delegation Status
                </h3>
                {isCheckingDelegation ? (
                  <p className="text-sm text-blue-700">Checking delegation status...</p>
                ) : currentDelegation ? (
                  <div className="space-y-2">
                    <p className="text-sm text-blue-700 font-mono break-all">
                      {currentDelegation === '0x'
                        ? 'No delegation (0x)'
                        : currentDelegation === '0x63c0c19a282a1b52b07dd5a65b58948a07dae32b'
                        ? 'MetaMask deleGator Core'
                        : 'Unknown contract'
                      }
                    </p>
                    <p className="text-xs text-blue-600 font-mono break-all">
                      Contract: {currentDelegation}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-blue-700">Unable to determine delegation status</p>
                )}
                <button
                  onClick={checkCurrentDelegation}
                  disabled={isCheckingDelegation}
                  className="mt-2 bg-blue-600 text-white px-3 py-1 rounded text-xs font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {isCheckingDelegation ? 'Checking...' : 'Refresh Status'}
                </button>
              </div>

              {/* Delegatee Contract Selection */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Select Action
                </h3>
                <div className="grid gap-4">
                  {DELEGATEE_CONTRACTS
                    .filter(contract =>
                      contract.address !== currentDelegation
                    )
                    .map((contract, index) => (
                    <div
                      key={index}
                      className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                        selectedContract?.name === contract.name
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedContract(contract)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold text-gray-900">
                            {contract.name}
                          </h4>
                          <p className="text-sm text-gray-600 mt-1">
                            {contract.description}
                          </p>
                          <p className="text-xs text-gray-500 font-mono mt-2 break-all">
                            {contract.address}
                          </p>
                        </div>
                        {contract.address === '0x0000000000000000000000000000000000000000' && (
                          <div className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-medium">
                            Revoke
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Authorization Section */}
              {selectedContract && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    EIP-7702 {selectedContract?.address === '0x0000000000000000000000000000000000000000' ? 'Revocation' : 'Authorization'} Workflow
                  </h3>
                  <div className="flex gap-4 flex-wrap">
                    <button
                      onClick={authorize7702}
                      disabled={isAuthorizing}
                      className={`px-6 py-2 rounded-md font-medium disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors ${
                        selectedContract?.address === '0x0000000000000000000000000000000000000000'
                          ? 'bg-red-600 text-white hover:bg-red-700'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      {isAuthorizing ? 'Preparing...' : `Prepare ${selectedContract?.address === '0x0000000000000000000000000000000000000000' ? 'Revocation' : 'Authorization'} Data`}
                    </button>
                    {authorizationHash && (
                      <button
                        onClick={signAuthorization}
                        disabled={isSigning}
                        className="bg-purple-600 text-white px-6 py-2 rounded-md font-medium hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                      >
                        {isSigning ? 'Signing...' : `Sign ${selectedContract?.address === '0x0000000000000000000000000000000000000000' ? 'Revocation' : 'Authorization'}`}
                      </button>
                    )}
                    {signedAuthorization && (
                      <button
                        onClick={submitAuthorization}
                        disabled={isSubmitting}
                        className={`px-6 py-2 rounded-md font-medium disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors ${
                          selectedContract?.address === '0x0000000000000000000000000000000000000000'
                            ? 'bg-red-600 text-white hover:bg-red-700'
                            : 'bg-green-600 text-white hover:bg-green-700'
                        }`}
                      >
                        {isSubmitting ? 'Submitting...' : `Send ${selectedContract?.address === '0x0000000000000000000000000000000000000000' ? 'Revocation' : 'Authorization'}`}
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
                      <pre className="text-xs text-purple-800 overflow-x-auto">
                        {JSON.stringify(signedAuthorization, null, 2)}
                      </pre>
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
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
              <h3 className="text-lg font-semibold text-green-900 mb-2">✅ Real EIP-7702 Implementation:</h3>
              <ul className="list-disc list-inside space-y-2 text-green-800">
                <li>Creates proper EIP-7702 authorization structure</li>
                <li>Signs authorization with correct format</li>
                <li>Submits authorization to blockchain</li>
                <li>Uses MetaMask deleGator Core contract</li>
                <li>Supports authorization revocation (zero address)</li>
              </ul>
            </div>
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
              This implementation follows the <a href="https://docs.metamask.io/delegation-toolkit/development/get-started/eip7702-quickstart/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline">official MetaMask Delegation Toolkit documentation</a> and supports
              the EIP7702StatelessDeleGator contract for a lightweight and secure way to upgrade an EOA to a smart account.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
