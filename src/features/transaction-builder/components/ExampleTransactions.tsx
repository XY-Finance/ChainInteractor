'use client'

import React from 'react'
import { Card } from '../../../components/ui/Card'
import { Button } from '../../../components/ui/Button'
import { addresses } from '../../../config/addresses'

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
    name: 'USDC Transfer',
    description: 'Transfer USDC tokens to another address',
    functionName: 'transfer',
    targetAddress: addresses.token.USDC,
    parameters: [
      {
        name: 'to',
        type: 'address',
        value: addresses.eoa.user0,
        description: 'Recipient address'
      },
      {
        name: 'amount',
        type: 'uint256',
        value: '1000000', // 1 USDC (6 decimals)
        description: 'Amount to transfer (in USDC units)'
      }
    ]
  },
  {
    name: 'USDC Approve',
    description: 'Approve another address to spend your USDC tokens',
    functionName: 'approve',
    targetAddress: addresses.token.USDC,
    parameters: [
      {
        name: 'spender',
        type: 'address',
        value: addresses.eoa.user0,
        description: 'Address to approve'
      },
      {
        name: 'amount',
        type: 'uint256',
        value: '1000000', // 1 USDC (6 decimals)
        description: 'Amount to approve (in USDC units)'
      }
    ]
  },
  {
    name: 'USDC Balance Check',
    description: 'Check USDC balance of an address',
    functionName: 'balanceOf',
    targetAddress: addresses.token.USDC,
    parameters: [
      {
        name: 'owner',
        type: 'address',
        value: addresses.eoa.user0,
        description: 'Address to check balance for'
      }
    ]
  },
  {
    name: 'USDC Allowance Check',
    description: 'Check USDC allowance for a spender',
    functionName: 'allowance',
    targetAddress: addresses.token.USDC,
    parameters: [
      {
        name: 'owner',
        type: 'address',
        value: addresses.eoa.user2,
        description: 'Token owner address'
      },
      {
        name: 'spender',
        type: 'address',
        value: addresses.eoa.user0,
        description: 'Spender address'
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
