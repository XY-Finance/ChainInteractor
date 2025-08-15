import { useState, useEffect } from 'react'
import { useAccount, usePublicClient, useWalletClient } from 'wagmi'
import { sepolia } from 'viem/chains'
import { getDeleGatorEnvironment, Implementation } from '@metamask/delegation-toolkit'
import { type DelegateeContract, type AuthorizationData, type SignedAuthorization } from '../types'
import { createLogEntry, handleError } from '../utils'

export function useEIP7702() {
  const { address, isConnected } = useAccount()
  const publicClient = usePublicClient()
  const { data: walletClient } = useWalletClient()

  const [selectedContract, setSelectedContract] = useState<DelegateeContract | null>(null)
  const [authorizationData, setAuthorizationData] = useState<AuthorizationData | null>(null)
  const [signedAuthorization, setSignedAuthorization] = useState<SignedAuthorization | null>(null)
  const [logs, setLogs] = useState<Array<{ timestamp: string; message: string; type?: string }>>([])

  const addLog = (message: string, type: 'info' | 'success' | 'error' | 'warning' = 'info') => {
    const logEntry = createLogEntry(message, type)
    setLogs(prev => [...prev, logEntry])
  }

  // Initialize delegatee contracts
  useEffect(() => {
    const initializeContracts = async () => {
      if (!publicClient) return

      try {
        const environment = getDeleGatorEnvironment(sepolia.id)
        const contractAddress = environment.implementations.EIP7702StatelessDeleGatorImpl

        const defaultContract: DelegateeContract = {
          name: 'MetaMask deleGator Core',
          address: contractAddress,
          description: 'Core MetaMask deleGator implementation for EIP-7702',
          implementation: Implementation.Stateless7702,
        }

        setSelectedContract(defaultContract)
        addLog('✅ Initialized delegatee contracts', 'success')
        addLog(`📋 MetaMask deleGator Core: ${contractAddress}`, 'info')
      } catch (error) {
        addLog(`❌ Error initializing contracts: ${handleError(error)}`, 'error')
      }
    }

    initializeContracts()
  }, [publicClient])

  return {
    address,
    isConnected,
    publicClient,
    walletClient,
    selectedContract,
    authorizationData,
    signedAuthorization,
    logs,
    setAuthorizationData,
    setSignedAuthorization,
    addLog,
  }
}
