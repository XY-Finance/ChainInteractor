'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useWalletManager } from '../../../hooks/useWalletManager'
import { addresses } from '../../../config/addresses'
import { sepolia } from 'viem/chains'
import { parseEther } from 'viem'
import { DelegateeContract } from '../types/eip7702'

interface EIP7702AuthorizationProps {
  addLog: (message: string) => void
}

const EIP7702Authorization = React.memo(function EIP7702Authorization({ addLog }: EIP7702AuthorizationProps) {
  const {
    address,
    publicClient,
    sign7702Authorization,
    submit7702Authorization,
    filterCurrentDelegatee,
    getDelegateeOptionsWithReasons,
    createSmartAccount,
    sendUserOperation,
    currentDelegation,
    checkCurrentDelegation
  } = useWalletManager()

  // EIP-7702 specific state
  const [selectedContract, setSelectedContract] = useState<DelegateeContract | null>(null)
  const [authorizationHash, setAuthorizationHash] = useState<any>(null)
  const [signedAuthorization, setSignedAuthorization] = useState<any>(null)
  const [verificationResult, setVerificationResult] = useState<any>(null)
  const [transactionHash, setTransactionHash] = useState<string | null>(null)
  const [smartAccountAddress, setSmartAccountAddress] = useState<string>('')
  const [userOpHash, setUserOpHash] = useState<string>('')
  const [isSendingUserOp, setIsSendingUserOp] = useState(false)
  const [recipientAddress, setRecipientAddress] = useState('')
  const [eip7702Amount, setEip7702Amount] = useState('')
  const [isAuthorizing, setIsAuthorizing] = useState(false)
  const [isSigning, setIsSigning] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isCheckingDelegation, setIsCheckingDelegation] = useState(false)

    // Check current delegation on mount only - memoized to prevent unnecessary re-runs
  const logDelegationStatus = useCallback(() => {
    if (address) {
      console.log(`🔍 Current delegation status: ${currentDelegation || 'Not delegated'}`)
    }
  }, [address, currentDelegation])

  // Check current delegation on mount only
  useEffect(() => {
    logDelegationStatus()
  }, [logDelegationStatus])

  // Available delegatee contracts
  const DELEGATEE_CONTRACTS: DelegateeContract[] = [
    {
      name: 'MetaMask deleGator Core',
      description: 'Core delegation contract for MetaMask',
      address: addresses.delegatee.metamask,
      requiresInjected: true
    },
    {
      name: 'Kernel ZeroDev 7702',
      description: 'ZeroDev delegation contract implementing EIP-7579',
      address: addresses.delegatee.kernel,
      requiresInjected: true
    },
    {
      name: 'No Delegation (Revoke)',
      description: 'Revoke current delegation (set to zero address)',
      address: addresses.common.zero,
      requiresInjected: false
    }
  ]

    // Memoized filtered delegatees to prevent unnecessary recalculations
    const filteredDelegatees = useMemo(() => {
      if (!address) return DELEGATEE_CONTRACTS

      try {
        // Get current delegation status
        const currentDelegationStatus = currentDelegation || addresses.common.zero

        // Filter delegatees based on current delegation
        const availableDelegatees = filterCurrentDelegatee(currentDelegationStatus, DELEGATEE_CONTRACTS)

        return availableDelegatees
      } catch (error) {
        console.error('Error filtering delegatees:', error)
        return DELEGATEE_CONTRACTS
      }
        }, [address, currentDelegation, filterCurrentDelegatee])

    // Memoized delegatee options with reasons to prevent unnecessary recalculations
    const delegateeOptionsWithReasons = useMemo(() => {
      return getDelegateeOptionsWithReasons(currentDelegation || addresses.common.zero, DELEGATEE_CONTRACTS)
    }, [currentDelegation, getDelegateeOptionsWithReasons])

    const createSmartAccountAction = async () => {
    if (!address) {
      addLog('❌ Please connect your wallet first')
      return
    }

    setIsSendingUserOp(true)
    addLog('🏗️ Creating smart account...')

    try {
      const smartAccount = await createSmartAccount()
      setSmartAccountAddress(smartAccount)
      addLog(`✅ Smart account created: ${smartAccount}`)
    } catch (error) {
      addLog(`❌ Failed to create smart account: ${error}`)
    } finally {
      setIsSendingUserOp(false)
    }
  }

  const sendUserOperationAction = async () => {
    if (!address || !recipientAddress || !eip7702Amount) {
      addLog('❌ Please fill in all required fields')
      return
    }

    setIsSendingUserOp(true)
    addLog('📤 Sending user operation...')

    try {
      const userOp = {
        target: recipientAddress,
        value: parseEther(eip7702Amount),
        data: '0x'
      }

      const hash = await sendUserOperation(userOp)
      setUserOpHash(hash)
      addLog(`✅ User operation sent successfully`)
      addLog(`📝 Transaction hash: ${hash}`)
    } catch (error) {
      addLog(`❌ Failed to send user operation: ${error}`)
    } finally {
      setIsSendingUserOp(false)
    }
  }

  const authorize7702 = async () => {
    if (!selectedContract || !address || !publicClient) {
      addLog('❌ Contract, address, or public client not available')
      return
    }

    const isRevocation = selectedContract.address === addresses.common.zero
    setIsAuthorizing(true)
    addLog(`🔐 Starting EIP-7702 ${isRevocation ? 'revocation' : 'authorization'}...`)

    try {
      const nonce = await publicClient.getTransactionCount({ address })
      addLog(`📊 Current nonce: ${nonce}`)

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

    const isRevocation = authorizationHash.contractAddress === addresses.common.zero
    setIsSigning(true)
    addLog(`✍️ Creating EIP-7702 ${isRevocation ? 'revocation' : 'authorization'}...`)

    try {
      const result = await sign7702Authorization(authorizationHash)

      const authorization = result.authorization || result
      const verification = result.verification

      setSignedAuthorization(authorization)
      setVerificationResult(verification)

      addLog(`✅ EIP-7702 ${isRevocation ? 'revocation' : 'authorization'} created successfully`)
      addLog(`📝 ${isRevocation ? 'Revocation' : 'Authorization'} structure:`)
      addLog(`   - Signer: ${address}`)
      addLog(`   - Delegated Contract: ${authorization.address}`)
      addLog(`   - Chain ID: ${authorization.chainId}`)
      addLog(`   - Nonce: ${authorization.nonce}`)
      addLog(`   - Signature: r=${authorization.r}, s=${authorization.s}, yParity=${authorization.yParity}`)

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

    const isRevocation = typeof signedAuthorization === 'object' && signedAuthorization.contractAddress === addresses.common.zero
    setIsSubmitting(true)
    addLog(`📤 Submitting EIP-7702 ${isRevocation ? 'revocation' : 'authorization'} to blockchain...`)

    try {
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

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-primary">EIP-7702 Authorization</h3>

      {/* Contract Selection */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-gray-700">Select Delegatee Contract</label>
          <button
            onClick={async () => {
              try {
                setIsCheckingDelegation(true)
                addLog(`🔄 Refreshing delegation status...`)
                await checkCurrentDelegation()
                addLog(`📋 Current delegation: ${currentDelegation || 'Not delegated'}`)
                const options = getDelegateeOptionsWithReasons(currentDelegation || addresses.common.zero, DELEGATEE_CONTRACTS)
                console.log('getDelegateeOptionsWithReasons result:', options)
                addLog(`📋 Available delegatees: ${options.length}`)
                options.forEach(delegatee => {
                  addLog(`   - ${delegatee.name}: ${delegatee.address} (supported: ${delegatee.isSupported})`)
                })
              } catch (error) {
                addLog(`❌ Failed to refresh delegation: ${error}`)
              } finally {
                setIsCheckingDelegation(false)
              }
            }}
            disabled={isCheckingDelegation}
            className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50"
          >
            {isCheckingDelegation ? 'Refreshing...' : 'Refresh Filtering'}
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {delegateeOptionsWithReasons.map((contract) => (
            <div
              key={contract.address}
              className={`p-4 border rounded-lg transition-colors ${
                !contract.isSupported
                  ? 'border-gray-300 bg-gray-50 cursor-not-allowed opacity-60'
                  : selectedContract?.address === contract.address
                  ? 'border-orange-500 bg-orange-50 cursor-pointer'
                  : 'border-gray-200 hover:border-gray-300 cursor-pointer'
              }`}
              onClick={() => contract.isSupported && setSelectedContract(contract)}
            >
              <div className="text-center">
                <h4 className="font-medium text-primary">{contract.name}</h4>
                <p className="text-sm text-secondary">{contract.description}</p>
                <p className="text-xs text-muted font-mono mt-1">
                  {contract.address.slice(0, 6)}...{contract.address.slice(-4)}
                </p>
                {!contract.isSupported && contract.reason && (
                  <p className="text-xs text-red-600 mt-2">
                    ⚠️ {contract.reason}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Authorization Steps */}
      {selectedContract && (
        <div className="space-y-4">
          <h4 className="text-md font-semibold text-primary">Authorization Steps</h4>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            {/* Step 1: Prepare Authorization */}
            <div className="mb-4">
              <h5 className="text-sm font-semibold text-gray-900 mb-2">Step 1: Prepare Authorization</h5>
              <p className="text-sm text-gray-700 mb-3">
                Prepare the authorization data for {selectedContract.name}
              </p>
              <button
                onClick={authorize7702}
                disabled={isAuthorizing}
                className="btn-primary px-4 py-2 text-sm"
              >
                {isAuthorizing ? 'Preparing...' : 'Prepare Authorization'}
              </button>

              {authorizationHash && (
                <div className="mt-4 p-3 bg-white border border-gray-300 rounded">
                  <h6 className="text-xs font-semibold text-gray-700 mb-2">Authorization Data Structure:</h6>
                  <div className="text-xs font-mono text-gray-600 space-y-1">
                    <div><strong>Address:</strong> {authorizationHash.address}</div>
                    <div><strong>Chain ID:</strong> {authorizationHash.chainId}</div>
                    <div><strong>Contract:</strong> {authorizationHash.contractAddress}</div>
                    <div><strong>Executor:</strong> {authorizationHash.executor}</div>
                  </div>
                </div>
              )}
            </div>

            {/* Step 2: Sign Authorization */}
            {authorizationHash && (
              <div className="mb-4 pt-4 border-t border-gray-300">
                <h5 className="text-sm font-semibold text-blue-900 mb-2">Step 2: Sign Authorization</h5>
                <p className="text-sm text-blue-800 mb-3">
                  Sign the authorization with your wallet
                </p>
                {!signedAuthorization && (
                  <button
                    onClick={signAuthorization}
                    disabled={isSigning}
                    className="btn-primary px-4 py-2 text-sm"
                  >
                    {isSigning ? 'Signing...' : 'Sign Authorization'}
                  </button>
                )}

                {signedAuthorization && (
                  <div className="mt-4 p-3 bg-white border border-blue-300 rounded">
                    <h6 className="text-xs font-semibold text-blue-700 mb-2">Signed Authorization Structure:</h6>
                    <div className="text-xs font-mono text-blue-600 space-y-1">
                      <div><strong>Signer:</strong> {signedAuthorization.address || signedAuthorization.signer}</div>
                      <div><strong>Delegated Contract:</strong> {signedAuthorization.contractAddress || signedAuthorization.delegatedContract}</div>
                      <div><strong>Chain ID:</strong> {signedAuthorization.chainId}</div>
                      <div><strong>Nonce:</strong> {signedAuthorization.nonce}</div>
                      <div><strong>Signature R:</strong> {signedAuthorization.r}</div>
                      <div><strong>Signature S:</strong> {signedAuthorization.s}</div>
                      <div><strong>Y Parity:</strong> {signedAuthorization.yParity}</div>
                    </div>

                    {verificationResult && (
                      <div className="mt-3 pt-3 border-t border-blue-200">
                        <h6 className="text-xs font-semibold text-blue-700 mb-2">Verification Results:</h6>
                        <div className="text-xs font-mono text-blue-600 space-y-1">
                          <div><strong>Signer Address:</strong> {verificationResult.signerAddress}</div>
                          <div><strong>Recovered Address:</strong> {verificationResult.recoveredAddress}</div>
                          <div><strong>Addresses Match:</strong>
                            <span className={verificationResult.addressesMatch ? 'text-green-600' : 'text-red-600'}>
                              {verificationResult.addressesMatch ? ' ✅ YES' : ' ❌ NO'}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Submit Authorization */}
            {signedAuthorization && (
              <div className="pt-4 border-t border-gray-300">
                <h5 className="text-sm font-semibold text-green-900 mb-2">Step 3: Submit Authorization</h5>
                <p className="text-sm text-green-800 mb-3">
                  Submit the signed authorization to the blockchain
                </p>
                {!transactionHash && (
                  <button
                    onClick={submitAuthorization}
                    disabled={isSubmitting}
                    className="btn-primary px-4 py-2 text-sm"
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Authorization'}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Transaction Hash Display */}
          {transactionHash && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
              <h5 className="text-sm font-semibold text-green-900 mb-2">Transaction Submitted</h5>
              <p className="text-sm text-green-800 font-mono break-all">
                Hash: {transactionHash}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Smart Account Operations */}
      <div className="space-y-6 mt-8">
        <h4 className="text-md font-semibold text-primary">Smart Account Operations</h4>

        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          {/* Create Smart Account */}
          <div className="mb-4">
            <h5 className="text-sm font-semibold text-gray-900 mb-2">Create Smart Account</h5>
            <p className="text-sm text-gray-700 mb-3">
              Create a smart account for advanced operations
            </p>
            <button
              onClick={createSmartAccountAction}
              disabled={isSendingUserOp}
              className="btn-primary px-4 py-2 text-sm"
            >
              {isSendingUserOp ? 'Creating...' : 'Create Smart Account'}
            </button>

            {smartAccountAddress && (
              <div className="mt-4 p-3 bg-white border border-gray-300 rounded">
                <h6 className="text-xs font-semibold text-gray-700 mb-2">Smart Account Created:</h6>
                <p className="text-xs font-mono text-gray-600 break-all">{smartAccountAddress}</p>
              </div>
            )}
          </div>

          {/* Send User Operation */}
          {smartAccountAddress && (
            <div className="pt-4 border-t border-gray-300">
              <h5 className="text-sm font-semibold text-blue-900 mb-2">Send User Operation</h5>
              <p className="text-sm text-blue-800 mb-3">
                Send a transaction through the smart account
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Recipient Address
                  </label>
                  <input
                    type="text"
                    value={recipientAddress}
                    onChange={(e) => setRecipientAddress(e.target.value)}
                    placeholder="0x..."
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Amount (ETH)
                  </label>
                  <input
                    type="number"
                    value={eip7702Amount}
                    onChange={(e) => setEip7702Amount(e.target.value)}
                    placeholder="0.01"
                    step="0.001"
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                  />
                </div>
              </div>

              <button
                onClick={sendUserOperationAction}
                disabled={isSendingUserOp || !recipientAddress || !eip7702Amount}
                className="btn-primary px-4 py-2 text-sm"
              >
                {isSendingUserOp ? 'Sending...' : 'Send User Operation'}
              </button>

              {userOpHash && (
                <div className="mt-4 p-3 bg-white border border-blue-300 rounded">
                  <h6 className="text-xs font-semibold text-blue-700 mb-2">User Operation Sent:</h6>
                  <p className="text-xs font-mono text-blue-600 break-all">{userOpHash}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
})

export default EIP7702Authorization
