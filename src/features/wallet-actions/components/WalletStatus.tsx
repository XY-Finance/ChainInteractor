'use client'

import { useWalletManager } from '../../../hooks/useWalletManager'
import { getDelegationDisplayName } from '../utils/delegationUtils'

interface WalletStatusProps {
  onRefreshStatus: () => void
  isRefreshing: boolean
}

export default function WalletStatus({ onRefreshStatus, isRefreshing }: WalletStatusProps) {
  const { currentAccount, currentDelegation, currentNonce } = useWalletManager()

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
