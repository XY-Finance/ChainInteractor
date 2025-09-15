'use client'

import React from 'react'
import { Card } from '../../../components/ui/Card'
import { Button } from '../../../components/ui/Button'
import ScrollableGrid from '../../../components/ui/ScrollableGrid'
import { addresses } from '../../../config/addresses'
import { encodeFunctionData, type Hex } from "viem"

interface ExampleTransaction {
  name: string
  description: string
  targetAddress: string
  abi: readonly any[]
  data: readonly any[]
}

interface ExampleTransactionsProps {
  onLoadExample: (example: ExampleTransaction) => void
}

const EXAMPLE_TRANSACTIONS: ExampleTransaction[] = [
  {
    name: 'ERC-2612 Permit',
    description: 'ERC-2612 permit function for gasless approvals',
    targetAddress: addresses.token.USDC,
    abi: [
      {
        type: "function",
        name: "permit",
        stateMutability: "nonpayable",
        inputs: [
          { name: "owner", type: "address" },
          { name: "spender", type: "address" },
          { name: "value", type: "uint256" },
          { name: "deadline", type: "uint256" },
          { name: "v", type: "uint8" },
          { name: "r", type: "bytes32" },
          { name: "s", type: "bytes32" },
        ],
        outputs: []
      },
    ] as const,
    data: [
      addresses.eoa.user0, // owner
      addresses.eoa.user1, // spender
      1000000n, // value (1 USDC)
      BigInt(Math.floor(Date.now() / 1000) + 1800), // deadline (30 min from now)
      27, // v
      "0x" + "11".repeat(32), // r
      "0x" + "22".repeat(32), // s
    ] as const
  },
  {
    name: 'USDC Transfer',
    description: 'Transfer USDC tokens to another address',
    targetAddress: addresses.token.USDC,
    abi: [
      {
        type: "function",
        name: "transfer",
        stateMutability: "nonpayable",
        inputs: [
          { name: "to", type: "address" },
          { name: "amount", type: "uint256" }
        ],
        outputs: [{ name: "", type: "bool" }]
      },
    ] as const,
    data: [
      addresses.eoa.user0, // to
      1000000n, // amount (1 USDC)
    ] as const
  },
  {
    name: 'USDC Approve',
    description: 'Approve another address to spend your USDC tokens',
    targetAddress: addresses.token.USDC,
    abi: [
      {
        type: "function",
        name: "approve",
        stateMutability: "nonpayable",
        inputs: [
          { name: "spender", type: "address" },
          { name: "amount", type: "uint256" }
        ],
        outputs: [{ name: "", type: "bool" }]
      },
    ] as const,
    data: [
      addresses.eoa.user0, // spender
      1000000n, // amount (1 USDC)
    ] as const
  },
  {
    name: 'USDC Balance Check',
    description: 'Check USDC balance of an address',
    targetAddress: addresses.token.USDC,
    abi: [
      {
        type: "function",
        name: "balanceOf",
        stateMutability: "view",
        inputs: [
          { name: "owner", type: "address" }
        ],
        outputs: [{ name: "", type: "uint256" }]
      },
    ] as const,
    data: [
      addresses.eoa.user0, // owner
    ] as const
  },
  {
    name: 'Multicall Aggregate',
    description: 'Execute multiple calls in a single transaction',
    targetAddress: '0x5BA1e12693Dc8F9c48aAD8770482f4739bEeD696', // Multicall3
    abi: [
      {
        type: "function",
        name: "aggregate",
        stateMutability: "nonpayable",
        inputs: [{
          name: "calls",
          type: "tuple[]",
          components: [
            { name: "target", type: "address" },
            { name: "callData", type: "bytes" }
          ],
        }],
        outputs: [
          { name: "blockNumber", type: "uint256" },
          { name: "returnData", type: "bytes[]" }
        ],
      },
    ] as const,
    data: [
      [
        {
          target: addresses.token.USDC,
          callData: "0x70a08231000000000000000000000000" + addresses.eoa.user0.slice(2) // balanceOf(user0)
        },
        {
          target: addresses.token.USDC,
          callData: "0x18160ddd" // totalSupply()
        },
      ],
    ] as const
  },
  {
    name: 'Install ECDSA Signer Module',
    description: 'Install ECDSA Signer module with user2 as the signer',
    targetAddress: addresses.eoa.user1,
    abi: [
      {
        type: "function",
        name: "installModule",
        stateMutability: "nonpayable",
        inputs: [
          { name: "moduleTypeId", type: "uint256" },
          { name: "module", type: "address" },
          { name: "initData", type: "bytes" }
        ],
        outputs: []
      },
    ] as const,
    data: [
      6n, // moduleTypeId for ECDSA Signer
      addresses.modules.ECDSASginer, // module address
      `0x${'0'.repeat(64)}${addresses.eoa.user2.slice(2)}`, // initData: 32 bytes of zeros + 20 bytes of user2 address
    ] as const
  },
  {
    name: 'EntryPoint handleOps (ERC-4337)',
    description: 'Execute multiple UserOperations in a single transaction using ERC-4337 EntryPoint',
    targetAddress: "0x0000000071727De22E5E9d8BAf0edAc6f37da032", // EntryPoint v0.7
    abi: [
      {
        type: "function",
        name: "handleOps",
        stateMutability: "nonpayable",
        inputs: [
          {
            name: "ops",
            type: "tuple[]",
            components: [
              { name: "sender", type: "address" },
              { name: "nonce", type: "uint256" },
              { name: "initCode", type: "bytes" },
              { name: "callData", type: "bytes" },
              { name: "accountGasLimits", type: "bytes32" },
              { name: "preVerificationGas", type: "uint256" },
              { name: "gasFees", type: "bytes32" },
              { name: "paymasterAndData", type: "bytes" },
              { name: "signature", type: "bytes" },
            ],
          },
          { name: "beneficiary", type: "address" },
        ],
        outputs: [],
      },
    ] as const,
    data: [
      [
        {
          sender: "0x6E54aCC586df80A709b3A273A0e2aA7236Fa8bf6",
          nonce: BigInt("40513160445560926781167239521379930015736461779804538940613875552392077901824"),
          initCode: "0x",
          callData: "0x",
          accountGasLimits: "0x000000000000000000000000001e8480000000000000000000000000001e8480" as Hex,
          preVerificationGas: 1_000_000n,
          gasFees: "0x0000000000000000000000000000000100000000000000000000000000000001" as Hex,
          paymasterAndData: "0x",
          signature: "0x",
        },
        {
          sender: "0x79E2F52Aebd0c7B717CF1631282f0b0251A01e1a",
          nonce: BigInt("40513160445560926781167239521379930015736461779804538940613875552392077901824"),
          initCode: "0x",
          callData: "0x",
          accountGasLimits: "0x000000000000000000000000001e8480000000000000000000000000001e8480" as Hex,
          preVerificationGas: 1_000_000n,
          gasFees: "0x0000000000000000000000000000000100000000000000000000000000000001" as Hex,
          paymasterAndData: "0x",
          signature: "0x",
        },
      ],
      "0x82712CD54eFd5DE8628Ee33589C529C7190e409A", // beneficiary
    ] as const
  }
]

const ExampleTransactions = React.memo(function ExampleTransactions({
  onLoadExample
}: ExampleTransactionsProps) {
  return (
    <Card title="Example ABI Transactions" subtitle="Try these common transaction types with proper ABI structure">
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
              <div className="font-medium">Function: {example.abi[0].name}</div>
              <div className="font-medium">Contract: {example.targetAddress}</div>
            </div>

            <div className="text-xs text-gray-500 mb-3">
              <div className="font-medium">Parameters:</div>
              {example.abi[0].inputs.map((input: any, inputIndex: number) => (
                <div key={inputIndex} className="ml-2">
                  • {input.name} ({input.type}): {example.data[inputIndex]?.toString() || 'N/A'}
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
