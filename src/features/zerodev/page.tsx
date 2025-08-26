'use client'

import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseEther } from 'viem'
import { useState } from 'react'
import { useWalletManager } from '../../hooks/useWalletManager'

export default function Home() {
  const { isConnected, currentAccount, error } = useWalletManager()
  const [amount, setAmount] = useState('')
  const [recipient, setRecipient] = useState('')

  const { data: hash, writeContract, isPending } = useWriteContract()

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  const sendTransaction = async () => {
    if (!amount || !recipient) return

    writeContract({
      address: recipient as `0x${string}`,
      abi: [],
      functionName: 'receive',
      value: parseEther(amount),
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            ZeroDev EIP-7702 Demo
          </h1>
          <p className="text-xl text-gray-600">
            Smart Account with EIP-7702 Support
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Project ID: {process.env.ZERODEV_PROJECT_ID || 'demo-project-id'}
          </p>
          <div className="mt-6">
            <a
              href="/eip7702"
              className="inline-flex items-center px-6 py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors"
            >
              🚀 Try MetaMask EIP-7702 Authorization
            </a>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          {!isConnected ? (
            <div className="text-center py-8">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-yellow-900 mb-3">
                  🔗 Connect Your Wallet First
                </h3>
                <p className="text-yellow-800 text-sm mb-4">
                  Please go to the <strong>Wallet Actions</strong> tab and connect your wallet first.
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
            <div className="space-y-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Connected Wallet Address
                </h3>
                <p className="text-sm text-gray-600 font-mono break-all">
                  {currentAccount?.address}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Type: {currentAccount?.type}
                </p>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Send Transaction
                </h3>

                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Recipient Address
                    </label>
                    <input
                      type="text"
                      value={recipient}
                      onChange={(e) => setRecipient(e.target.value)}
                      placeholder="0x..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <button
                    onClick={sendTransaction}
                    disabled={isPending || !amount || !recipient}
                    className="w-full bg-blue-600 text-white py-3 px-4 rounded-md font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    {isPending ? 'Sending...' : 'Send Transaction'}
                  </button>
                </div>

                {hash && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-blue-900 mb-2">
                      Transaction Hash
                    </h4>
                    <p className="text-xs text-blue-700 font-mono break-all">
                      {hash}
                    </p>
                    {isConfirming && (
                      <p className="text-sm text-blue-600 mt-2">
                        Confirming transaction...
                      </p>
                    )}
                    {isSuccess && (
                      <p className="text-sm text-green-600 mt-2">
                        Transaction confirmed!
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            About EIP-7702
          </h2>
          <div className="prose prose-gray max-w-none">
            <p className="text-gray-600 mb-4">
              EIP-7702 is an Ethereum Improvement Proposal that enables smart accounts to be deployed
              as regular EOAs (Externally Owned Accounts) while maintaining smart account functionality.
              This provides better compatibility and gas efficiency.
            </p>
            <p className="text-gray-600">
              ZeroDev&apos;s implementation allows you to create smart accounts that can be used like regular
              wallets but with advanced features like gas sponsorship, transaction batching, and more.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
