'use client'

import React, { useState, useCallback } from 'react'
import { useWalletManager } from '../../hooks/useWalletManager'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import TransactionBuilder from './components/TransactionBuilder'

const TransactionBuilderPage = React.memo(function TransactionBuilderPage() {
  const { currentAccount } = useWalletManager()

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Transaction Builder</h1>
        <p className="text-gray-600">
          Dynamically build and execute any transaction with custom function calls
        </p>
      </div>

      {/* Transaction Builder */}
      <div className="mb-8">
        <TransactionBuilder />
      </div>
    </div>
  )
})

export default TransactionBuilderPage
