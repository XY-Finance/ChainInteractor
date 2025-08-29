'use client'

import React, { useState } from 'react'
import { Card } from '../../../components/ui/Card'
import { Button } from '../../../components/ui/Button'
import type { TransactionData } from './TransactionBuilder'

interface TransactionPreviewProps {
  transactionData: TransactionData
}

const TransactionPreview = React.memo(function TransactionPreview({
  transactionData
}: TransactionPreviewProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null)

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(field)
      setTimeout(() => setCopiedField(null), 2000)
    } catch (error) {
      console.error('Failed to copy to clipboard:', error)
    }
  }

  const CopyButton = ({ text, field, label }: { text: string; field: string; label: string }) => (
    <Button
      onClick={() => copyToClipboard(text, field)}
      variant="outline"
      size="sm"
      className="ml-2"
    >
      {copiedField === field ? '✅ Copied!' : '📋 Copy'}
    </Button>
  )

  return (
    <Card title="Transaction Preview" subtitle="Review your transaction data">
      <div className="space-y-6">
        {/* Function Signature */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Function Signature</h4>
          <div className="bg-gray-100 p-3 rounded-md font-mono text-sm">
            {transactionData.functionName}({transactionData.parameters.map(p => `${p.type} ${p.name}`).join(', ')})
          </div>
        </div>

        {/* Encoded Data */}
        {transactionData.encodedData && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-gray-700">Encoded Function Data</h4>
              <CopyButton
                text={transactionData.encodedData}
                field="encoded"
                label="Copy Encoded Data"
              />
            </div>
            <div className="bg-blue-50 border border-blue-200 p-3 rounded-md">
              <code className="text-sm text-blue-800 break-all">
                {transactionData.encodedData}
              </code>
            </div>
          </div>
        )}



        {/* Transaction Hash */}
        {transactionData.txHash && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-gray-700">Transaction Hash</h4>
              <CopyButton
                text={transactionData.txHash}
                field="hash"
                label="Copy Transaction Hash"
              />
            </div>
            <div className="bg-purple-50 border border-purple-200 p-3 rounded-md">
              <code className="text-sm text-purple-800 break-all">
                {transactionData.txHash}
              </code>
            </div>
            <div className="mt-2 text-xs text-gray-500">
              Transaction has been submitted to the network. Check your wallet or block explorer for confirmation.
            </div>
          </div>
        )}

        {/* Transaction Status */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <div className={`w-3 h-3 rounded-full mr-2 ${transactionData.encodedData ? 'bg-blue-500' : 'bg-gray-300'}`} />
            <span className="text-sm text-gray-600">Encoded</span>
          </div>
          <div className="flex items-center">
            <div className={`w-3 h-3 rounded-full mr-2 ${transactionData.txHash ? 'bg-purple-500' : 'bg-gray-300'}`} />
            <span className="text-sm text-gray-600">Sent</span>
          </div>
        </div>
      </div>
    </Card>
  )
})

export default TransactionPreview
