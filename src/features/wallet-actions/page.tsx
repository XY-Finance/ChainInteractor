'use client'

import { useState, useEffect } from 'react'
import { useWalletManager } from '../../hooks/useWalletManager'
import WalletStatus from './components/WalletStatus'
import UseCaseCard from './components/UseCaseCard'
import EIP7702Authorization from './components/EIP7702Authorization'
import ERC20Permit from './components/ERC20Permit'
import OperationLogs from './components/OperationLogs'

// Use case definitions
const COMMON_USE_CASES = [
  {
    id: 'erc20permit',
    title: 'ERC20 Permit',
    description: 'Sign gasless token approvals using EIP-712 signatures',
    status: 'ready' as const
  },
  {
    id: 'eip7702',
    title: 'EIP-7702 Authorization',
    description: 'Delegate control over your EOA to smart contracts',
    status: 'ready' as const
  },
  {
    id: 'eip2612',
    title: 'EIP-2612 Permit',
    description: 'Gasless token approvals with deadline-based permits',
    status: 'tba' as const
  },
  {
    id: 'eip4361',
    title: 'EIP-4361 Sign-In',
    description: 'Sign-in with Ethereum for decentralized authentication',
    status: 'tba' as const
  },
  {
    id: 'eip1271',
    title: 'EIP-1271 Contract Verification',
    description: 'Verify signatures from smart contract wallets',
    status: 'tba' as const
  },
  {
    id: 'eip191',
    title: 'EIP-191 Personal Sign',
    description: 'Standard personal message signing with prefix',
    status: 'tba' as const
  }
]

export default function WalletActionsPage() {
  const {
    currentAccount,
    currentDelegation,
    currentNonce,
    checkCurrentDelegation
  } = useWalletManager()

  // State management
  const [selectedUseCase, setSelectedUseCase] = useState(COMMON_USE_CASES[0])
  const [logs, setLogs] = useState<string[]>([])
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isActionsExpanded, setIsActionsExpanded] = useState(true)

  // Add timestamp to log messages
  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    const logMessage = `${timestamp}: ${message}`
    setLogs(prev => [...prev, logMessage])
  }

  // Refresh wallet status
  const handleRefreshStatus = async () => {
    if (!currentAccount) return

    setIsRefreshing(true)
    addLog('🔄 Refreshing wallet status...')

    try {
      await checkCurrentDelegation()
      addLog('✅ Wallet status refreshed successfully')
    } catch (error) {
      addLog(`❌ Failed to refresh wallet status: ${error}`)
    } finally {
      setIsRefreshing(false)
    }
  }

  // Handle use case selection
  const handleUseCaseSelect = (useCase: typeof COMMON_USE_CASES[0]) => {
    setSelectedUseCase(useCase)
    addLog(`📋 Selected use case: ${useCase.title}`)
  }

  // Handle use case action
  const handleUseCaseAction = (useCase: typeof COMMON_USE_CASES[0]) => {
    if (useCase.status === 'tba') {
      addLog(`⏳ ${useCase.title} - Coming Soon!`)
      return
    }

    setSelectedUseCase(useCase)
    addLog(`🚀 Starting ${useCase.title}...`)
  }

  // Check delegation status on mount
  useEffect(() => {
    if (currentAccount) {
      checkCurrentDelegation().catch(console.error)
    }
  }, [currentAccount, checkCurrentDelegation])

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Wallet Actions</h1>
        <p className="text-gray-600">
          Explore various wallet operations and signing methods
        </p>
      </div>

      {!currentAccount ? (
        <div className="text-center py-12">
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-8 max-w-md mx-auto">
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
          {/* Wallet Status */}
          <div className="mb-8">
            <WalletStatus
              onRefreshStatus={handleRefreshStatus}
              isRefreshing={isRefreshing}
            />
          </div>

          {/* Available Actions - Foldable */}
          <div className="mb-8">
            <div className="bg-white border border-gray-200 rounded-lg">
              <button
                onClick={() => setIsActionsExpanded(!isActionsExpanded)}
                className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
              >
                <h2 className="text-xl font-semibold text-gray-900">Available Actions</h2>
                <span className="text-gray-500">
                  {isActionsExpanded ? '▼' : '▶'}
                </span>
              </button>

              {isActionsExpanded && (
                <div className="px-6 pb-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {COMMON_USE_CASES.map((useCase) => (
                      <UseCaseCard
                        key={useCase.id}
                        useCase={useCase}
                        isSelected={selectedUseCase.id === useCase.id}
                        onSelect={() => handleUseCaseSelect(useCase)}
                        onAction={() => handleUseCaseAction(useCase)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Area */}
          <div className="mb-8">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                {selectedUseCase.title}
              </h2>

              {selectedUseCase.status === 'tba' ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🚧</div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">
                    Coming Soon
                  </h3>
                  <p className="text-gray-500">
                    {selectedUseCase.description}
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {selectedUseCase.id === 'erc20permit' && (
                    <ERC20Permit addLog={addLog} />
                  )}

                  {selectedUseCase.id === 'eip7702' && (
                    <EIP7702Authorization addLog={addLog} />
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Operation Logs */}
          <div className="mt-8">
            <OperationLogs logs={logs} />
          </div>
        </>
      )}
    </div>
  )
}
