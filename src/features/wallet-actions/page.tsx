'use client'

import { useState, useEffect } from 'react'
import { usePublicClient } from 'wagmi'
import { useWalletManager } from '../../hooks/useWalletManager'
import {
  parseEther,
  formatEther,
  type Address,
  type Hex,
  encodePacked,
  keccak256,
  toHex,
  parseUnits,
  formatUnits
} from 'viem'
import { sepolia } from 'viem/chains'

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

const COMMON_USE_CASES = [
  {
    id: 'erc20-permit',
    name: 'ERC20 Permit',
    description: 'Sign ERC20 permit for gasless token approvals',
    icon: '🪙',
    category: 'Token Approvals',
    status: 'ready'
  },
  {
    id: 'delegation',
    name: 'Delegation',
    description: 'Delegate voting power to another address (TBA)',
    icon: '️',
    category: 'Governance',
    status: 'tba'
  },
  {
    id: 'authorization',
    name: 'Authorization',
    description: 'Authorize contract to act on your behalf (TBA)',
    icon: '🔐',
    category: 'Access Control',
    status: 'tba'
  },
  {
    id: 'signature',
    name: 'Message Signature',
    description: 'Sign arbitrary messages for verification (TBA)',
    icon: '✍️',
    category: 'General',
    status: 'tba'
  },
  {
    id: 'typed-data',
    name: 'Typed Data (EIP-712)',
    description: 'Sign structured data with EIP-712 (TBA)',
    icon: '📋',
    category: 'Advanced',
    status: 'tba'
  }
]

export default function WalletActionsPage() {
  const { isConnected, currentAccount, signMessage, signTypedData } = useWalletManager()
  const publicClient = usePublicClient()

  const [selectedToken, setSelectedToken] = useState(COMMON_TOKENS[0])
  const [selectedUseCase, setSelectedUseCase] = useState(COMMON_USE_CASES[0])
  const [spenderAddress, setSpenderAddress] = useState('0x856c363e043Ac34B19D584D3930bfa615947994E')
  const [amount, setAmount] = useState('1')
  const [deadline, setDeadline] = useState('2756099813')
  const [signature, setSignature] = useState<string>('')
  const [isSigning, setIsSigning] = useState(false)
  const [logs, setLogs] = useState<string[]>([])
  const [customMessage, setCustomMessage] = useState('')
  const [typedData, setTypedData] = useState('')

  const address = currentAccount?.address
  const walletType = currentAccount?.type

  useEffect(() => {
    // Set default deadline to 1 hour from now
    // const oneHourFromNow = Math.floor(Date.now() / 1000) + 3600
    // setDeadline(oneHourFromNow.toString())
  }, [])

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

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

  const signERC20Permit = async () => {
    if (!isConnected || !address) {
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
  }

  const signCustomMessage = async () => {
    if (!isConnected || !address) {
      addLog('❌ Please connect your wallet first')
      return
    }

    if (!customMessage.trim()) {
      addLog('❌ Please enter a message to sign')
      return
    }

    setIsSigning(true)
    addLog(`✍️ Signing custom message...`)

    try {
      addLog(`📝 Message to sign: "${customMessage}"`)
      addLog(`👤 Signer address: ${address}`)

      const sig = await signMessage(customMessage)
      setSignature(sig)

      addLog(`✅ Message signed successfully!`)
      addLog(`🔐 Signature: ${sig}`)

      // Split signature components
      const r = sig.slice(0, 66)
      const s = '0x' + sig.slice(66, 130)
      const v = parseInt(sig.slice(130, 132), 16)

      addLog(`📊 Signature components:`)
      addLog(`   - V: ${v}`)
      addLog(`   - R: ${r}`)
      addLog(`   - S: ${s}`)
    } catch (error) {
      addLog(`❌ Failed to sign message: ${error}`)
    } finally {
      setIsSigning(false)
    }
  }

  const signTypedDataFunction = async () => {
    if (!isConnected || !address) {
      addLog('❌ Please connect your wallet first')
      return
    }

    if (!typedData.trim()) {
      addLog('❌ Please enter typed data to sign')
      return
    }

    setIsSigning(true)
    addLog(`📋 Signing typed data...`)

    try {
      // Parse the typed data JSON
      const parsedData = JSON.parse(typedData)
      const { domain, types, message } = parsedData

      addLog(`🔍 Parsed Typed Data Structure:`)
      addLog(`📋 Types: ${JSON.stringify(types, null, 2)}`)
      addLog(`🌐 Domain: ${JSON.stringify(domain, null, 2)}`)
      addLog(`💬 Message: ${JSON.stringify(message, null, 2)}`)

      // Convert any BigInt values in the message to strings
      const serializedMessage = JSON.parse(JSON.stringify(message, (key, value) => {
        if (typeof value === 'bigint') {
          return value.toString()
        }
        return value
      }))

      addLog(`🔄 Serialized Message: ${JSON.stringify(serializedMessage, null, 2)}`)

      const sig = await signTypedData(domain, types, serializedMessage)
      setSignature(sig)

      addLog(`✅ Typed data signed successfully!`)
      addLog(`🔐 Signature: ${sig}`)

      // Split signature components
      const r = sig.slice(0, 66)
      const s = '0x' + sig.slice(66, 130)
      const v = parseInt(sig.slice(130, 132), 16)

      addLog(`📊 Signature components:`)
      addLog(`   - V: ${v}`)
      addLog(`   - R: ${r}`)
      addLog(`   - S: ${s}`)
    } catch (error) {
      addLog(`❌ Failed to sign typed data: ${error}`)
    } finally {
      setIsSigning(false)
    }
  }

  const handleUseCaseAction = async () => {
    if (selectedUseCase.status === 'tba') {
      addLog(`⚠️ ${selectedUseCase.name} is not yet implemented (TBA)`)
      return
    }

    switch (selectedUseCase.id) {
      case 'erc20-permit':
        await signERC20Permit()
        break
      case 'signature':
        await signCustomMessage()
        break
      case 'typed-data':
        await signTypedDataFunction()
        break
      default:
        addLog(`⚠️ ${selectedUseCase.name} not yet implemented`)
    }
  }

  const getWalletDisplayName = (type: string) => {
    switch (type) {
      case 'injected':
        return 'MetaMask'
      case 'local':
        return 'Local Key'
      default:
        return type
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-100 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-primary mb-4">
             Wallet Actions Hub
          </h1>
          <p className="text-lg text-secondary max-w-3xl mx-auto">
            Sign ERC20 permits, delegations, and other common authorization messages with any connected wallet.
            This hub provides a comprehensive interface for various signing use cases.
          </p>
        </div>

        {/* Main Content */}
        <div className="card mb-8 shadow-lg">
          <h2 className="text-2xl font-bold text-primary mb-6">
            Wallet Actions Hub
          </h2>

          {!isConnected ? (
            <div className="text-center py-12">
              <div className="card bg-orange-50 border-orange-200 max-w-md mx-auto">
                <h3 className="text-lg font-semibold text-orange-900 mb-3">
                  🔐 Connect Your Wallet First
                </h3>
                <p className="text-orange-800 text-sm mb-4">
                  Please connect your wallet using the dropdown in the top right to start signing permits and authorizations.
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Connected Wallet Info */}
              {isConnected && address && (
                <div className="card bg-blue-50 border-blue-200 mb-6">
                  <h3 className="text-lg font-semibold text-blue-900 mb-2">Connected Wallet</h3>
                  <p className="text-blue-800 text-sm">
                    <strong>Type:</strong> {getWalletDisplayName(walletType || 'unknown')}
                  </p>
                  <p className="text-blue-800 text-sm">
                    <strong>Address:</strong> {address}
                  </p>
                  <p className="text-blue-800 text-sm mt-2">
                    ✅ Wallet connected! You can now sign ERC20 permits, custom messages, and EIP-712 typed data.
                  </p>
                </div>
              )}

              {/* Use Case Selection */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-primary">Select Use Case</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {COMMON_USE_CASES.map((useCase) => (
                    <div
                      key={useCase.id}
                      className={`p-4 border rounded-lg transition-colors ${
                        useCase.status === 'tba'
                          ? 'border-gray-300 bg-gray-50 cursor-not-allowed opacity-60'
                          : selectedUseCase.id === useCase.id
                          ? 'border-orange-500 bg-orange-50 cursor-pointer'
                          : 'border-gray-200 hover:border-gray-300 cursor-pointer'
                      }`}
                      onClick={() => useCase.status === 'ready' && setSelectedUseCase(useCase)}
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{useCase.icon}</span>
                        <div>
                          <div className="flex items-center space-x-2">
                            <h4 className="font-medium text-primary">{useCase.name}</h4>
                            {useCase.status === 'tba' && (
                              <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                                TBA
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-secondary">{useCase.description}</p>
                          <span className="text-xs text-muted bg-gray-100 px-2 py-1 rounded mt-1 inline-block">
                            {useCase.category}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ERC20 Permit Section */}
              {selectedUseCase.id === 'erc20-permit' && (
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
                      <input
                        type="text"
                        value={spenderAddress}
                        onChange={(e) => setSpenderAddress(e.target.value)}
                        placeholder="0x..."
                        className="input-base"
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
                        className="input-base"
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
                      className="input-base"
                    />
                    <p className="text-xs text-muted mt-1">
                      Current deadline: {deadline ? new Date(Number(deadline) * 1000).toLocaleString() : 'Not set'}
                    </p>
                  </div>
                </div>
              )}

              {/* Custom Message Section */}
              {selectedUseCase.id === 'signature' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-primary">Custom Message</h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Message to Sign
                    </label>
                    <textarea
                      value={customMessage}
                      onChange={(e) => setCustomMessage(e.target.value)}
                      placeholder="Enter your message here..."
                      rows={4}
                      className="input-base"
                    />
                  </div>
                </div>
              )}

              {/* Typed Data Section */}
              {selectedUseCase.id === 'typed-data' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-primary">Typed Data (EIP-712)</h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Typed Data JSON
                    </label>
                    <textarea
                      value={typedData}
                      onChange={(e) => setTypedData(e.target.value)}
                      placeholder='{"types": {...}, "primaryType": "...", "domain": {...}, "message": {...}}'
                      rows={6}
                      className="input-base font-mono text-sm"
                    />
                  </div>
                </div>
              )}

              {/* Action Button */}
              <div className="pt-6 border-t">
                {selectedUseCase.status === 'tba' ? (
                  <div className="text-center py-6">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-yellow-900 mb-2">
                        🚧 Coming Soon
                      </h3>
                      <p className="text-yellow-800 text-sm">
                        {selectedUseCase.name} functionality is currently under development and will be available soon.
                      </p>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={handleUseCaseAction}
                    disabled={isSigning}
                    className="btn-primary w-full px-6 py-3"
                  >
                    {isSigning ? 'Signing...' : `Sign ${selectedUseCase.name}`}
                  </button>
                )}
              </div>

              {/* Signature Display */}
              {signature && (
                <div className="card bg-green-50 border-green-200">
                  <h4 className="text-sm font-semibold text-green-900 mb-2">Signature</h4>
                  <p className="text-xs text-green-800 font-mono break-all">{signature}</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Logs Section */}
        <div className="card mb-8 shadow-lg">
          <h2 className="text-2xl font-bold text-primary mb-4">
            Operation Logs
          </h2>
          <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm h-64 overflow-y-auto">
            {logs.length === 0 ? (
              <p className="text-muted">No logs yet. Connect your wallet to get started.</p>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="mb-1">
                  {log}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Information Section */}
        <div className="card shadow-lg">
          <h2 className="text-2xl font-bold text-primary mb-4">
            About Wallet Actions & Authorizations
          </h2>
          <div className="prose prose-gray max-w-none">
            <p className="text-secondary mb-4">
              This hub provides a comprehensive interface for signing various types of authorization messages with any connected wallet.
              From ERC20 permits for gasless token approvals to custom message signatures and EIP-712 typed data.
            </p>

            <div className="grid md:grid-cols-2 gap-6 mt-6">
              <div className="card bg-blue-50 border-blue-200">
                <h3 className="text-lg font-semibold text-blue-900 mb-2">ERC20 Permit ✅</h3>
                <p className="text-blue-800 text-sm">
                  Sign permits to allow contracts to spend your tokens without requiring a separate approval transaction.
                  This enables gasless token interactions.
                </p>
              </div>

              <div className="card bg-gray-50 border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Message Signing 🚧</h3>
                <p className="text-gray-800 text-sm">
                  Sign arbitrary messages for authentication, verification, or authorization purposes.
                  Useful for off-chain verification. <strong>Coming soon!</strong>
                </p>
              </div>

              <div className="card bg-gray-50 border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">EIP-712 Typed Data 🚧</h3>
                <p className="text-gray-800 text-sm">
                  Sign structured data with EIP-712 for better security and user experience.
                  Provides human-readable signing messages. <strong>Coming soon!</strong>
                </p>
              </div>

              <div className="card bg-gray-50 border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Delegation 🚧</h3>
                <p className="text-gray-800 text-sm">
                  Delegate voting power or other permissions to another address.
                  Common in governance and access control systems. <strong>Coming soon!</strong>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
