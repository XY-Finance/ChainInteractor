'use client'

import { useState, useEffect, useCallback } from 'react'
import { useWalletManager } from '../../hooks/useWalletManager'

interface NetworkInfo {
  chainId: number
  name: string
  isSupported: boolean
  isDefault: boolean
  chain: any
}

export default function NetworkSelector() {
  const {
    isConnected,
    getCurrentNetwork,
    getSupportedNetworks,
    switchNetwork,
    setNetworkChangeCallback
  } = useWalletManager()

  const [currentNetwork, setCurrentNetwork] = useState<NetworkInfo | null>(null)
  const [supportedNetworks, setSupportedNetworks] = useState<NetworkInfo[]>([])
  const [isSwitching, setIsSwitching] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  // Memoized network update function to prevent recreation
  const updateNetworkState = useCallback(() => {
    if (isConnected) {
      const network = getCurrentNetwork()
      if (network) {
        const supportedNetworksList = getSupportedNetworks()
        const currentNetworkInfo = supportedNetworksList.find(n => n.chainId === network.chainId)
        setCurrentNetwork(currentNetworkInfo || {
          chainId: network.chainId,
          name: network.name,
          isSupported: network.isSupported,
          isDefault: false,
          chain: null
        })
        setSupportedNetworks(supportedNetworksList)
      }
    } else {
      setCurrentNetwork(null)
      setSupportedNetworks([])
    }
  }, [isConnected, getCurrentNetwork, getSupportedNetworks])

  // Memoized network change callback to prevent recreation
  const networkChangeHandler = useCallback((network: { chainId: number; name: string; isSupported: boolean }) => {
    const supportedNetworksList = getSupportedNetworks()
    const currentNetworkInfo = supportedNetworksList.find(n => n.chainId === network.chainId)
    setCurrentNetwork(currentNetworkInfo || {
      chainId: network.chainId,
      name: network.name,
      isSupported: network.isSupported,
      isDefault: false,
      chain: null
    })
  }, [getSupportedNetworks])

  // Update current network when wallet connects or network changes
  useEffect(() => {
    updateNetworkState()

    if (isConnected) {
      // Set up network change callback
      setNetworkChangeCallback(networkChangeHandler)
    }
  }, [isConnected, updateNetworkState, setNetworkChangeCallback, networkChangeHandler])

  const handleNetworkSwitch = async (chainId: number) => {
    if (!isConnected) return

    setIsSwitching(true)
    try {
      await switchNetwork(chainId)
      setIsOpen(false)
    } catch (error) {
      console.error('Failed to switch network:', error)
      // You might want to show a toast notification here
    } finally {
      setIsSwitching(false)
    }
  }

  if (!isConnected) {
    return null
  }

  const getNetworkIcon = (chainId: number) => {
    switch (chainId) {
      case 11155111: // Sepolia
        return '🔴'
      default:
        return '🌐'
    }
  }

  const getNetworkStatusColor = (network: NetworkInfo) => {
    if (network.chainId === currentNetwork?.chainId) {
      return 'text-green-600'
    }
    if (!network.isSupported) {
      return 'text-gray-400'
    }
    return 'text-gray-700'
  }

  return (
    <div className="relative">
      {/* Current Network Display */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center space-x-2 px-3 py-2 border rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors ${
          currentNetwork?.isSupported
            ? 'bg-green-50 border-green-300 text-green-700 hover:bg-green-100'
            : 'bg-red-50 border-red-300 text-red-700 hover:bg-red-100'
        }`}
        disabled={isSwitching}
      >
        <span className="text-lg">
          {currentNetwork ? getNetworkIcon(currentNetwork.chainId) : '🔴'}
        </span>
        <span className="text-sm font-medium">
          {currentNetwork?.name || 'Sepolia Testnet'}
        </span>
        <span className="opacity-70">
          {isSwitching ? '⏳' : '▼'}
        </span>
      </button>

      {/* Network Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-300 rounded-lg shadow-lg z-50">
          <div className="p-2">
            <div className="text-xs font-medium text-gray-500 mb-2 px-2">Available Networks</div>

            {supportedNetworks.map((network) => (
              <button
                key={network.chainId}
                onClick={() => handleNetworkSwitch(network.chainId)}
                disabled={isSwitching || network.chainId === currentNetwork?.chainId}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md text-left transition-colors ${
                  network.chainId === currentNetwork?.chainId
                    ? 'bg-green-50 text-green-700'
                    : network.isSupported
                    ? 'hover:bg-gray-50 text-gray-700'
                    : 'text-gray-400 cursor-not-allowed'
                }`}
              >
                <span className="text-lg">{getNetworkIcon(network.chainId)}</span>
                <div className="flex-1">
                  <div className={`text-sm font-medium ${getNetworkStatusColor(network)}`}>
                    {network.name}
                  </div>
                  <div className="text-xs text-gray-500">
                    Chain ID: {network.chainId}
                  </div>
                </div>
                {network.chainId === currentNetwork?.chainId && (
                  <span className="text-green-600">✓</span>
                )}
                {!network.isSupported && (
                  <span className="text-xs text-gray-400">(Disabled)</span>
                )}
              </button>
            ))}

            {/* Info about disabled networks */}
            <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-xs text-blue-800">
                <strong>Note:</strong> Only Sepolia Testnet is currently supported for this demo.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
