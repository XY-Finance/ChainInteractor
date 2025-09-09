'use client'

import React from 'react'
import { Card } from '../../../components/ui/Card'
import { Button } from '../../../components/ui/Button'
import ScrollableGrid from '../../../components/ui/ScrollableGrid'
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
  },
  {
    name: 'Install ECDSA Signer Module',
    description: 'Install ECDSA Signer module with user2 as the signer',
    functionName: 'installModule',
    targetAddress: addresses.eoa.user1,
    parameters: [
      {
        name: 'moduleTypeId',
        type: 'uint256',
        value: '6',
        description: 'Module type ID for ECDSA Signer'
      },
      {
        name: 'module',
        type: 'address',
        value: addresses.modules.ECDSASginer,
        description: 'ECDSASginer module address'
      },
      {
        name: 'initData',
        type: 'bytes',
        value: `0x${'0'.repeat(64)}${addresses.eoa.user2.slice(2)}`, // 32 bytes of zeros + 20 bytes of user2 address
        description: 'Initialization data: 32 bytes of zeros + 20 bytes of user2 address'
      }
    ]
  }
]

const ExampleTransactions = React.memo(function ExampleTransactions({
  onLoadExample
}: ExampleTransactionsProps) {
  return (
    <Card title="Example Transactions" subtitle="Try these common transaction types">
      <ScrollableGrid
        gridCols={{
          default: 'grid-cols-1',
          md: 'md:grid-cols-2'
        }}
      >
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
      </ScrollableGrid>
    </Card>
  )
})

export default ExampleTransactions
