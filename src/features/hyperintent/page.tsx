'use client'

import { useState, useEffect } from 'react'
import { HyperCard, PositionDetails, PnLChart } from './components'
import { AccountData, PositionDetailsData } from './types'
import { useWalletManager } from '@/hooks/useWalletManager'
import { useHyperliquidData } from './hooks/useHyperliquidData'

export default function HyperIntentPage() {
  const { address: connectedAddress, isConnected } = useWalletManager()
  const [inputValue, setInputValue] = useState('')
  const [searchAddress, setSearchAddress] = useState("")
  const [isValidAddress, setIsValidAddress] = useState(true)
  
  const placeholderTexts = [
    "Enter trader address...",
    "Track wallet address...",
    "Discover trader portfolio...",
    "Search address 0x1234...",
    "Explore new portfolio..."
  ]
  
  const [currentPlaceholderIndex, setCurrentPlaceholderIndex] = useState(0)
  
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPlaceholderIndex((prevIndex) => {
        if (prevIndex >= placeholderTexts.length - 1) {
          const extendedTexts = [...placeholderTexts, ...placeholderTexts]
          return prevIndex + 1
        }
        return prevIndex + 1
      })
    }, 3000)
    
    return () => clearInterval(interval)
  }, [placeholderTexts.length])

  const positionDetailsData: PositionDetailsData = {
    totalValue: 21147.09,
    marginUsedRatio: 106.93,
    directionBias: 'Long',
    longExposure: 100.00,
    shortExposure: 0.00,
    longValue: 21147.09,
    shortValue: 0.00,
    roe: -30.96,
    upnl: -1744.13
  }

  const userAddress = (searchAddress || connectedAddress || "0x0000000000000000000000000000000000000000") as `0x${string}`
  
  const { clearinghouseState } = useHyperliquidData(userAddress)
  
  const updatedAccountData: AccountData = {
    totalValue: clearinghouseState?.marginSummary?.accountValue ? parseFloat(clearinghouseState.marginSummary.accountValue) : 0.00,
    breakdown: {
      perpetual: clearinghouseState?.marginSummary?.accountValue ? parseFloat(clearinghouseState.marginSummary.accountValue) : 0.00,
      spot: clearinghouseState?.marginSummary?.accountValue ? parseFloat(clearinghouseState.marginSummary.accountValue) : 0.00
    },
    totalPositionValue: clearinghouseState?.marginSummary?.totalNtlPos ? parseFloat(clearinghouseState.marginSummary.totalNtlPos) : 0.00,
    withdrawable: clearinghouseState?.withdrawable ? parseFloat(clearinghouseState.withdrawable) : 0.00,
    leverageRatio: (clearinghouseState?.marginSummary?.accountValue && clearinghouseState?.marginSummary?.totalNtlPos) ? Number((parseFloat(clearinghouseState.marginSummary.totalNtlPos) / parseFloat(clearinghouseState.marginSummary.accountValue)).toFixed(2)) : 0.00,
  }

  // Show wallet connection prompt if not connected
  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-green-900 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-screen">
            <div className="text-center">
              <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-400 via-pink-500 to-yellow-400 bg-clip-text text-transparent animate-gradient bg-[length:200%_200%]">HyperIntent Dashboard</h1>
              <p className="text-gray-300 text-xl mb-6">Please connect your wallet to view trading data</p>
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50">
                <p className="text-gray-400">Connect your wallet using the wallet selector in the navigation</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-green-900 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-400 via-pink-500 to-yellow-400 bg-clip-text text-transparent animate-gradient bg-[length:200%_200%]">HyperIntent Dashboard</h1>
          
          {/* Search Address Input */}
          <div className="relative max-w-md">
            <div className="relative">
              <input
                type="text"
                placeholder=" "
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value)
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const address = inputValue.trim()

                    // Validate Ethereum address format only on Enter
                    const ethAddressRegex = /^0x[a-fA-F0-9]{40}$/
                    const isValid = address === "" || ethAddressRegex.test(address)
                    setIsValidAddress(isValid)
                    
                    // Update searchAddress and userAddress if valid
                    if (isValid) {
                      setSearchAddress(address)
                    }
                  }
                }}
                className={`w-full px-3 py-2 pl-10 bg-white/20 backdrop-blur-sm rounded-full border focus:outline-none focus:ring-2 focus:ring-white/50 text-white placeholder-white/60 text-sm transition-colors duration-200 ${
                  isValidAddress 
                    ? 'border-white/30 focus:border-white/50' 
                    : 'border-red-400/50 focus:border-red-400/70'
                }`}
              />
              
              {/* Placeholder - Slide scroll effect */}
              {inputValue === '' && (
                <div className="absolute left-10 top-1/2 transform -translate-y-1/2 pointer-events-none overflow-hidden h-5">
                  <div 
                    className="transition-transform duration-700 ease-in-out"
                    style={{
                      transform: `translateY(-${currentPlaceholderIndex * 20}px)`
                    }}
                  >
                    {/* Generate looping text */}
                    {[...placeholderTexts, ...placeholderTexts, ...placeholderTexts].map((text, index) => (
                      <div 
                        key={index} 
                        className="h-5 flex items-center text-white/60 text-sm"
                      >
                        {text}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {/* Search Icon */}
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                <svg className="w-4 h-4 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
            {/* Error Message */}
            {!isValidAddress && (
              <p className="text-red-400 text-xs mt-1 ml-3">Please enter a valid Ethereum address</p>
              )}
          </div>
        </div>
        
        {/* Wallet Address Section with Copy Trading Button */}
        <div className="mb-4 flex items-center justify-between">
          {/* Wallet Address - Even Smaller */}
          <div className="p-2 rounded-lg">
            <div className="flex items-center space-x-1.5">
              {/* User Icon */}
              <img 
                src="/user-icon.webp" 
                alt="user" 
                className="w-10 h-10 rounded-full object-cover scale-[0.9]"
              />
              
              {/* Address Text */}
              <span className="text-white font-bold text-sm">
                {userAddress.length > 10 
                  ? `${userAddress.slice(0, 6)}...${userAddress.slice(-4)}`
                  : userAddress
                }
              </span>
              
              {/* Copy Icon */}
              <button 
                className="text-white hover:text-gray-300 transition-colors duration-200"
                onClick={() => {
                  navigator.clipboard.writeText(userAddress)
                    .then(() => {
                      // Optional: Show success feedback
                      console.log('Address copied to clipboard')
                    })
                    .catch((err) => {
                      console.error('Failed to copy address:', err)
                    })
                }}
                title="Copy full address"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
            </div>
          </div>
          
          {/* Copy Trading Button */}
          <button className="px-3 py-1.5 bg-gray-700/50 hover:bg-gray-600/50 backdrop-blur-sm rounded-lg border border-gray-600/50 text-gray-300 hover:text-white transition-all duration-200 flex items-center space-x-1.5 text-sm">
            {/* Network/Sharing Icon */}
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
            </svg>
            <span>Copy Trading</span>
          </button>
        </div>
        
        {/* Top Section - Financial Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <HyperCard
            userAddress={userAddress}
            title="Account Total Value"
            mainValue={updatedAccountData.totalValue.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
            breakdown={[
              { label: 'Perp', value: `${updatedAccountData.breakdown.perpetual.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}`, color: 'blue' },
              { label: 'Spot', value: '', color: 'blue' }
            ]}
            progressValue={Math.round((updatedAccountData.breakdown.perpetual / updatedAccountData.totalValue) * 100)}
            progressColor="blue"
          />
          
          <HyperCard
            userAddress={userAddress}
            title="Free Margin Available"
            mainValue={updatedAccountData.withdrawable.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
            breakdown={[
              { label: 'Withdrawable', value: `${((updatedAccountData.withdrawable / updatedAccountData.breakdown.perpetual) * 100).toFixed(2)}%`, color: 'yellow' }
            ]}
            progressValue={Number(((updatedAccountData.withdrawable / updatedAccountData.breakdown.perpetual) * 100).toFixed(2))}
            progressColor="yellow"
          />
          
          <HyperCard
            userAddress={userAddress}
            title="Total Position Value"
            mainValue={updatedAccountData.totalPositionValue.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
            breakdown={[
              { label: 'Leverage Ratio', value: `${updatedAccountData.leverageRatio}x`, color: 'purple' }
            ]}
            progressValue={updatedAccountData.leverageRatio}
            progressColor="purple"
          />
        </div>

        {/* Bottom Section - Trading Details and Chart */}
        <div className="grid grid-cols-1 gap-6">
          {/* <PositionDetails {...positionDetailsData} /> */}
          <PnLChart userAddress={userAddress} />
        </div>
      </div>
    </div>
  )
}
