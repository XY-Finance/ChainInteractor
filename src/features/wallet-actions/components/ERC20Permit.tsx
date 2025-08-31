'use client'

import { useState, useCallback } from 'react'
import { useWalletManager } from '../../../hooks/useWalletManager'
import { parseEther, formatEther, type Address, parseUnits, formatUnits } from 'viem'
import { sepolia } from 'viem/chains'
import { AddressSelector } from '../../../components/ui'

interface ERC20PermitProps {
  addLog: (message: string) => void
}

interface PermitData {
  owner: Address
  spender: Address
  value: bigint
  nonce: bigint
  deadline: bigint
}

interface ERC20Permit {
  token: string
  name: string
  symbol: string
  decimals: number
  permitData: PermitData
}

const COMMON_TOKENS = [
  {
    name: 'USDC',
    symbol: 'USDC',
    address: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238', // Sepolia USDC
    decimals: 6
  },
  {
    name: 'WETH',
    symbol: 'WETH',
    address: '0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9', // Sepolia WETH
    decimals: 18
  },
  {
    name: 'DAI',
    symbol: 'DAI',
    address: '0x68194a729C2450ad26072b3D33ADaCbcef39D574', // Sepolia DAI
    decimals: 18
  }
]

export default function ERC20Permit({ addLog }: ERC20PermitProps) {
  const { address, publicClient, signTypedData } = useWalletManager()

  const [selectedToken, setSelectedToken] = useState(COMMON_TOKENS[0])
  const [spenderAddress, setSpenderAddress] = useState('0x856c363e043Ac34B19D584D3930bfa615947994E')
  const [amount, setAmount] = useState('100')
  const [deadline, setDeadline] = useState('2756099813')
  const [signature, setSignature] = useState<string>('')
  const [isSigning, setIsSigning] = useState(false)

  // Removed empty useEffect - no longer needed

  const generatePermitData = async (): Promise<PermitData> => {
    if (!address || !publicClient) {
      throw new Error('Wallet not connected or public client not available')
    }

    try {
      addLog(`🔍 Calling nonces(${address}) on ${selectedToken.symbol} at ${selectedToken.address}...`)

      const nonce = await publicClient.readContract({
        address: selectedToken.address as Address,
        abi: [{
          name: 'nonces',
          type: 'function',
          stateMutability: 'view',
          inputs: [{ name: 'owner', type: 'address' }],
          outputs: [{ name: '', type: 'uint256' }]
        }],
        functionName: 'nonces',
        args: [address as Address]
      })

      addLog(`✅ Got nonce: ${nonce}`)

      return {
        owner: address as Address,
        spender: spenderAddress as Address,
        value: parseUnits(amount, selectedToken.decimals),
        nonce: nonce as bigint,
        deadline: BigInt(deadline)
      }
    } catch (error) {
      addLog(`❌ Failed to get nonce: ${error}`)
      addLog(`🔍 Error details: ${JSON.stringify(error, null, 2)}`)
      throw new Error(`Failed to get nonce for ${selectedToken.symbol}. This token may not support ERC20Permit.`)
    }
  }

  const getTokenVersion = async (): Promise<string> => {
    if (!publicClient) {
      throw new Error('Public client not available')
    }

    try {
      return await publicClient.readContract({
        address: selectedToken.address as Address,
        abi: [{
          name: 'version',
          type: 'function',
          stateMutability: 'view',
          inputs: [],
          outputs: [{ name: '', type: 'string' }]
        }],
        functionName: 'version'
      }) as string
    } catch (error) {
      console.warn(`⚠️ Failed to get token version for ${selectedToken.symbol}:`, error)
      throw new Error(`Token version not available for ${selectedToken.symbol}. This may not be a standard ERC20Permit token.`)
    }
  }

  const signERC20Permit = useCallback(async () => {
    if (!address) {
      addLog('❌ Please connect your wallet first')
      return
    }

    if (!spenderAddress || !amount || !deadline) {
      addLog('❌ Please fill in all required fields')
      return
    }

    setIsSigning(true)
    addLog(`🪙 Signing ERC20 permit for ${selectedToken.symbol}...`)

    try {
      const permitData = await generatePermitData()
      const tokenVersion = await getTokenVersion()

      addLog(`📝 Permit data:`)
      addLog(`   - Owner: ${permitData.owner}`)
      addLog(`   - Spender: ${permitData.spender}`)
      addLog(`   - Value: ${formatUnits(permitData.value, selectedToken.decimals)} ${selectedToken.symbol}`)
      addLog(`   - Nonce: ${permitData.nonce}`)
      addLog(`   - Deadline: ${new Date(Number(permitData.deadline) * 1000).toLocaleString()}`)
      addLog(`   - Token Version: ${tokenVersion}`)

      // Create the permit message to sign following EIP-2612 pattern
      const domain = {
        name: selectedToken.name,
        version: tokenVersion,
        chainId: sepolia.id.toString(),
        verifyingContract: selectedToken.address as Address
      }

      const types = {
        EIP712Domain: [
          { name: 'name', type: 'string' },
          { name: 'version', type: 'string' },
          { name: 'chainId', type: 'uint256' },
          { name: 'verifyingContract', type: 'address' }
        ],
        Permit: [
          { name: 'owner', type: 'address' },
          { name: 'spender', type: 'address' },
          { name: 'value', type: 'uint256' },
          { name: 'nonce', type: 'uint256' },
          { name: 'deadline', type: 'uint256' }
        ]
      }

      // Convert BigInt values to strings for JSON serialization
      const message = {
        owner: permitData.owner,
        spender: permitData.spender,
        value: permitData.value.toString(),
        nonce: permitData.nonce.toString(),
        deadline: permitData.deadline.toString()
      }

      // Log the complete EIP-712 data structure
      addLog(`🔍 EIP-712 Typed Data Structure:`)
      addLog(`📋 Types: ${JSON.stringify(types, null, 2)}`)
      addLog(`🌐 Domain: ${JSON.stringify(domain, null, 2)}`)
      addLog(`💬 Message: ${JSON.stringify(message, null, 2)}`)

      // Use proper EIP-712 signing for ERC20 permits
      const sig = await signTypedData(domain, types, message)
      setSignature(sig)

      addLog(`✅ Permit signed successfully!`)
      addLog(`🔐 Signature: ${sig}`)

      // Split signature for permit() function
      const r = sig.slice(0, 66)
      const s = '0x' + sig.slice(66, 130)
      const v = parseInt(sig.slice(130, 132), 16)

      addLog(`📊 Signature components for permit():`)
      addLog(`   - V: ${v}`)
      addLog(`   - R: ${r}`)
      addLog(`   - S: ${s}`)

      addLog(`🚀 This signature can be used to call permit() on the ${selectedToken.symbol} contract`)
      addLog(`📝 permit(${permitData.owner}, ${permitData.spender}, ${permitData.value.toString()}, ${permitData.deadline.toString()}, ${v}, ${r}, ${s})`)
    } catch (error) {
      addLog(`❌ Failed to sign permit: ${error}`)
    } finally {
      setIsSigning(false)
    }
  }, [address, spenderAddress, amount, deadline, selectedToken, signTypedData, addLog])

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-primary">ERC20 Permit Configuration</h3>

      {/* Token Selection */}
      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-700">Select Token</label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {COMMON_TOKENS.map((token) => (
            <div
              key={token.address}
              className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                selectedToken.address === token.address
                  ? 'border-orange-500 bg-orange-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setSelectedToken(token)}
            >
              <div className="text-center">
                <h4 className="font-medium text-primary">{token.symbol}</h4>
                <p className="text-sm text-secondary">{token.name}</p>
                <p className="text-xs text-muted font-mono mt-1">
                  {token.address.slice(0, 6)}...{token.address.slice(-4)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Permit Parameters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Spender Address
          </label>
          <AddressSelector
            value={spenderAddress}
            onChange={setSpenderAddress}
            placeholder="Select spender address..."
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Amount
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="100"
            step="0.000001"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Deadline (Unix timestamp)
        </label>
        <input
          type="number"
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
          placeholder="1234567890"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <p className="text-xs text-gray-500 mt-1">
          Current deadline: {deadline ? new Date(Number(deadline) * 1000).toLocaleString() : 'Not set'}
        </p>
      </div>

      {/* Action Button */}
      <button
        onClick={signERC20Permit}
        disabled={isSigning}
        className="btn-primary w-full px-6 py-3"
      >
        {isSigning ? 'Signing...' : `Sign ${selectedToken.symbol} Permit`}
      </button>

      {/* Signature Display */}
      {signature && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-green-900 mb-2">Signature</h4>
          <p className="text-xs text-green-800 font-mono break-all">{signature}</p>
        </div>
      )}
    </div>
  )
}
