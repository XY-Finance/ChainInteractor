'use client'

import React from 'react'
import { Card } from '../../../components/ui/Card'
import { Button } from '../../../components/ui/Button'

interface ExampleTransaction {
  name: string
  description: string
  functionName: string
  targetAddress: string
  parameters: Array<{
    name: string
    type: string
    value: string
    description: string
  }>
}

interface ExampleTransactionsProps {
  onLoadExample: (example: ExampleTransaction) => void
}

const EXAMPLE_TRANSACTIONS: ExampleTransaction[] = [
  {
    name: 'ERC20 Transfer',
    description: 'Transfer ERC20 tokens to another address',
    functionName: 'transfer',
    targetAddress: '0xA0b86a33E6441b8c4C8C8C8C8C8C8C8C8C8C8C8C8', // Example token address
    parameters: [
      {
        name: 'to',
        type: 'address',
        value: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
        description: 'Recipient address'
      },
      {
        name: 'amount',
        type: 'uint256',
        value: '1000000000000000000',
        description: 'Amount to transfer (in wei)'
      }
    ]
  },
  {
    name: 'ERC20 Approve',
    description: 'Approve another address to spend your tokens',
    functionName: 'approve',
    targetAddress: '0xA0b86a33E6441b8c4C8C8C8C8C8C8C8C8C8C8C8C8', // Example token address
    parameters: [
      {
        name: 'spender',
        type: 'address',
        value: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
        description: 'Address to approve'
      },
      {
        name: 'amount',
        type: 'uint256',
        value: '1000000000000000000',
        description: 'Amount to approve (in wei)'
      }
    ]
  },
  {
    name: 'ERC721 Transfer',
    description: 'Transfer an NFT to another address',
    functionName: 'transferFrom',
    targetAddress: '0xB0b86a33E6441b8c4C8C8C8C8C8C8C8C8C8C8C8C8', // Example NFT address
    parameters: [
      {
        name: 'from',
        type: 'address',
        value: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
        description: 'Current owner address'
      },
      {
        name: 'to',
        type: 'address',
        value: '0x842d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
        description: 'New owner address'
      },
      {
        name: 'tokenId',
        type: 'uint256',
        value: '1',
        description: 'NFT token ID'
      }
    ]
  },
  {
    name: 'Simple Storage Set',
    description: 'Set a value in a simple storage contract',
    functionName: 'set',
    targetAddress: '0xC0b86a33E6441b8c4C8C8C8C8C8C8C8C8C8C8C8C8', // Example storage contract
    parameters: [
      {
        name: 'value',
        type: 'uint256',
        value: '42',
        description: 'Value to store'
      }
    ]
  }
]

const ExampleTransactions = React.memo(function ExampleTransactions({
  onLoadExample
}: ExampleTransactionsProps) {
  return (
    <Card title="Example Transactions" subtitle="Try these common transaction types">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {EXAMPLE_TRANSACTIONS.map((example, index) => (
          <div key={index} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
            <h4 className="font-medium text-gray-900 mb-2">{example.name}</h4>
            <p className="text-sm text-gray-600 mb-3">{example.description}</p>

            <div className="text-xs text-gray-500 mb-3">
              <div className="font-medium">Function: {example.functionName}</div>
              <div className="font-medium">Contract: {example.targetAddress}</div>
            </div>

            <div className="text-xs text-gray-500 mb-3">
              <div className="font-medium">Parameters:</div>
              {example.parameters.map((param, paramIndex) => (
                <div key={paramIndex} className="ml-2">
                  • {param.name} ({param.type}): {param.description}
                </div>
              ))}
            </div>

            <Button
              onClick={() => onLoadExample(example)}
              variant="outline"
              size="sm"
              className="w-full"
            >
              📋 Load Example
            </Button>
          </div>
        ))}
      </div>
    </Card>
  )
})

export default ExampleTransactions
