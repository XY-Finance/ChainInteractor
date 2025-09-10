'use client'

import React from 'react'
import { Card } from '../../../components/ui/Card'
import { Button } from '../../../components/ui/Button'
import ScrollableGrid from '../../../components/ui/ScrollableGrid'
import { addresses } from '../../../config/addresses'
import type { Parameter } from './TransactionBuilder'

interface ExampleParameter extends Parameter {
  description: string
  components?: ExampleParameter[]
}

interface ExampleTransaction {
  name: string
  description: string
  functionName: string
  targetAddress: string
  parameters: Array<ExampleParameter>
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
        id: '1',
        name: 'to',
        type: 'address',
        value: addresses.eoa.user0,
        description: 'Recipient address'
      },
      {
        id: '2',
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
        id: '1',
        name: 'spender',
        type: 'address',
        value: addresses.eoa.user0,
        description: 'Address to approve'
      },
      {
        id: '2',
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
        id: '1',
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
        id: '1',
        name: 'owner',
        type: 'address',
        value: addresses.eoa.user2,
        description: 'Token owner address'
      },
      {
        id: '2',
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
        id: '1',
        name: 'moduleTypeId',
        type: 'uint256',
        value: '6',
        description: 'Module type ID for ECDSA Signer'
      },
      {
        id: '2',
        name: 'module',
        type: 'address',
        value: addresses.modules.ECDSASginer,
        description: 'ECDSASginer module address'
      },
      {
        id: '3',
        name: 'initData',
        type: 'bytes',
        value: `0x${'0'.repeat(64)}${addresses.eoa.user2.slice(2)}`, // 32 bytes of zeros + 20 bytes of user2 address
        description: 'Initialization data: 32 bytes of zeros + 20 bytes of user2 address'
      }
    ]
  },
  {
    name: 'EntryPoint handleOps',
    description: 'Handle multiple user operations with PackedUserOperation (v0.7 packed layout)',
    functionName: 'handleOps',
    targetAddress: '0x0000000071727De22E5E9d8BAf0edAc6f37da032',
    parameters: [
      {
        id: '1',
        name: 'ops',
        type: 'array',
        value: '[]',
        description: 'Array of PackedUserOperation tuples',
        components: [
          {
            id: '1-1',
            name: 'tuple',
            type: 'tuple',
            value: '{}',
            description: 'First PackedUserOperation tuple',
            components: [
              {
                id: '1-1-1',
                name: 'sender',
                type: 'address',
                value: '0x6E54aCC586df80A709b3A273A0e2aA7236Fa8bf6',
                description: 'User operation sender address'
              },
              {
                id: '1-1-2',
                name: 'nonce',
                type: 'uint256',
                value: '40513160445560926781167239521379930015736461779804538940613875552392077901824',
                description: 'User operation nonce'
              },
              {
                id: '1-1-3',
                name: 'initCode',
                type: 'bytes',
                value: '0x',
                description: 'Account initialization code'
              },
              {
                id: '1-1-4',
                name: 'callData',
                type: 'bytes',
                value: '0x',
                description: 'Call data for the operation'
              },
              {
                id: '1-1-5',
                name: 'accountGasLimits',
                type: 'bytes32',
                value: '0x000000000000000000000000001e8480000000000000000000000000001e8480',
                description: 'Account gas limits (verification + call gas)'
              },
              {
                id: '1-1-6',
                name: 'preVerificationGas',
                type: 'uint256',
                value: '1000000',
                description: 'Pre-verification gas amount'
              },
              {
                id: '1-1-7',
                name: 'gasFees',
                type: 'bytes32',
                value: '0x0000000000000000000000000000000100000000000000000000000000000001',
                description: 'Gas fees (maxFeePerGas + maxPriorityFeePerGas)'
              },
              {
                id: '1-1-8',
                name: 'paymasterAndData',
                type: 'bytes',
                value: '0x',
                description: 'Paymaster address and data'
              },
              {
                id: '1-1-9',
                name: 'signature',
                type: 'bytes',
                value: '0x',
                description: 'User operation signature'
              }
            ]
          },
          {
            id: '1-2',
            name: 'tuple',
            type: 'tuple',
            value: '{}',
            description: 'Second PackedUserOperation tuple',
            components: [
              {
                id: '1-2-1',
                name: 'sender',
                type: 'address',
                value: '0x79E2F52Aebd0c7B717CF1631282f0b0251A01e1a',
                description: 'User operation sender address'
              },
              {
                id: '1-2-2',
                name: 'nonce',
                type: 'uint256',
                value: '40513160445560926781167239521379930015736461779804538940613875552392077901824',
                description: 'User operation nonce'
              },
              {
                id: '1-2-3',
                name: 'initCode',
                type: 'bytes',
                value: '0x',
                description: 'Account initialization code'
              },
              {
                id: '1-2-4',
                name: 'callData',
                type: 'bytes',
                value: '0x',
                description: 'Call data for the operation'
              },
              {
                id: '1-2-5',
                name: 'accountGasLimits',
                type: 'bytes32',
                value: '0x000000000000000000000000001e8480000000000000000000000000001e8480',
                description: 'Account gas limits (verification + call gas)'
              },
              {
                id: '1-2-6',
                name: 'preVerificationGas',
                type: 'uint256',
                value: '1000000',
                description: 'Pre-verification gas amount'
              },
              {
                id: '1-2-7',
                name: 'gasFees',
                type: 'bytes32',
                value: '0x0000000000000000000000000000000100000000000000000000000000000001',
                description: 'Gas fees (maxFeePerGas + maxPriorityFeePerGas)'
              },
              {
                id: '1-2-8',
                name: 'paymasterAndData',
                type: 'bytes',
                value: '0x',
                description: 'Paymaster address and data'
              },
              {
                id: '1-2-9',
                name: 'signature',
                type: 'bytes',
                value: '0x',
                description: 'User operation signature'
              }
            ]
          }
        ]
      },
      {
        id: '2',
        name: 'beneficiary',
        type: 'address',
        value: '0x82712CD54eFd5DE8628Ee33589C529C7190e409A',
        description: 'Address to receive gas refunds'
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
