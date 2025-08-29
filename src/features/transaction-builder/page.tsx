'use client'

import React, { useState, useCallback } from 'react'
import { useWalletManager } from '../../hooks/useWalletManager'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import TransactionBuilder from './components/TransactionBuilder'
import OperationLogs from '../wallet-actions/components/OperationLogs'

const TransactionBuilderPage = React.memo(function TransactionBuilderPage() {
  const { currentAccount } = useWalletManager()
  const [logs, setLogs] = useState<string[]>([])

  // Add timestamp to log messages
  const addLog = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    const logMessage = `${timestamp}: ${message}`
    setLogs(prev => [...prev, logMessage])
  }, [])

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
        <TransactionBuilder addLog={addLog} />
      </div>

      {/* Operation Logs */}
      <div className="mb-8">
        <OperationLogs logs={logs} />
      </div>
    </div>
  )
})

export default TransactionBuilderPage
