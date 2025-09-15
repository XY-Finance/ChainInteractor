'use client'

import React from 'react'
import { useWalletManager } from '../../hooks/useWalletManager'
import TransactionBuilder from '../../features/transaction-builder/components/TransactionBuilder'

const TransactionBuilderPage = React.memo(function TransactionBuilderPage() {
  const { currentAccount } = useWalletManager()

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Tx Builder (ABI)</h1>
        <p className="text-gray-600">
          Build transactions using proper ABI structure with viem.encodeFunctionData compatibility
        </p>
      </div>

      {/* Tx Builder */}
      <div className="mb-8">
        <TransactionBuilder />
      </div>
    </div>
  )
})

export default TransactionBuilderPage
