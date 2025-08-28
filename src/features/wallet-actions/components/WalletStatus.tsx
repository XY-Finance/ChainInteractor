'use client'

import { useWalletManager } from '../../../hooks/useWalletManager'
import { getDelegationDisplayName } from '../utils/delegationUtils'

interface WalletStatusProps {
  onRefreshStatus: () => void
  isRefreshing: boolean
  isLoading?: boolean
  isRenewingAccount?: boolean
}

export default function WalletStatus({ onRefreshStatus, isRefreshing, isLoading = false, isRenewingAccount = false }: WalletStatusProps) {
  const { currentAccount, currentDelegation, currentNonce } = useWalletManager()

  if (isLoading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6 animate-pulse">
        <div className="flex items-center justify-between mb-4">
          <div className="h-6 bg-gray-200 rounded w-32"></div>
          <div className="h-8 bg-gray-200 rounded w-24"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div>
              <div className="h-4 bg-gray-200 rounded w-16 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-48"></div>
            </div>
            <div>
              <div className="h-4 bg-gray-200 rounded w-12 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-20"></div>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-24"></div>
            </div>
            <div>
              <div className="h-4 bg-gray-200 rounded w-16 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-8"></div>
            </div>
          </div>
        </div>

        {isRenewingAccount && (
          <div className="mt-4 text-center">
            <div className="inline-flex items-center text-sm text-blue-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
              Renewing account...
            </div>
          </div>
        )}
      </div>
    )
  }

  if (!currentAccount) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-yellow-800 mb-2">No Wallet Connected</h3>
        <p className="text-yellow-700">Please connect a wallet to view status and perform actions.</p>
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Connected Wallet</h3>
        <button
          onClick={onRefreshStatus}
          disabled={isRefreshing}
          className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50"
        >
          {isRefreshing ? 'Refreshing...' : 'Refresh Status'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-600">Address</label>
            <p className="text-sm font-mono text-gray-900 break-all">{currentAccount.address}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600">Type</label>
            <p className="text-sm text-gray-900 capitalize">{currentAccount.type}</p>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-600">Current Delegation</label>
            <p className="text-sm text-gray-900">
              {getDelegationDisplayName(currentDelegation)}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600">Nonce</label>
            <p className="text-sm text-gray-900">{currentNonce}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
