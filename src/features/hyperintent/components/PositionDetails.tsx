'use client'

import React from 'react'

interface PositionDetailsProps {
  totalValue: number
  marginUsedRatio: number
  directionBias: 'Long' | 'Short'
  longExposure: number
  shortExposure: number
  longValue: number
  shortValue: number
  roe: number
  upnl: number
}

export function PositionDetails({
  totalValue,
  marginUsedRatio,
  directionBias,
  longExposure,
  shortExposure,
  longValue,
  shortValue,
  roe,
  upnl
}: PositionDetailsProps) {
  const isLong = directionBias === 'Long'
  const isRoePositive = roe >= 0
  const isUpnlPositive = upnl >= 0

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50 shadow-2xl h-96">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white mb-2">Perp Total Value</h3>
        <div className="text-3xl font-bold text-white">
          ${totalValue.toLocaleString()}
        </div>
      </div>

      <div className="space-y-6">
        {/* Margin Used Ratio */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-300 text-sm">Margin Used Ratio</span>
            <span className="text-white font-medium">{marginUsedRatio.toFixed(2)}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div 
              className="bg-blue-400 h-2 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(marginUsedRatio, 100)}%` }}
            ></div>
          </div>
        </div>

        {/* Direction Bias */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-300 text-sm">Direction Bias</span>
            <div className="flex items-center space-x-2">
              <span className={`text-sm font-medium ${isLong ? 'text-green-400' : 'text-red-400'}`}>
                {directionBias}
              </span>
              <div className={`w-4 h-4 ${isLong ? 'text-green-400' : 'text-red-400'}`}>
                {isLong ? (
                  <svg fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 10.293a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l4.293-4.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
            </div>
          </div>
          
          {/* Long/Short Exposure Bars */}
          <div className="space-y-2">
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-gray-400 text-xs">Long Exposure</span>
                <span className="text-green-400 text-xs font-medium">{longExposure.toFixed(2)}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-1.5">
                <div 
                  className="bg-green-400 h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${longExposure}%` }}
                ></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-gray-400 text-xs">Short Exposure</span>
                <span className="text-red-400 text-xs font-medium">{shortExposure.toFixed(2)}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-1.5">
                <div 
                  className="bg-red-400 h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${shortExposure}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Position Distribution */}
        <div>
          <h4 className="text-gray-300 text-sm mb-3">Position Distribution</h4>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-400 text-sm">Long Value</span>
              <span className="text-green-400 font-medium">${longValue.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400 text-sm">Short Value</span>
              <span className="text-gray-500 font-medium">${shortValue.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* ROE and uPnL */}
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-300 text-sm">ROE</span>
            <span className={`font-medium ${isRoePositive ? 'text-green-400' : 'text-red-400'}`}>
              {roe.toFixed(2)}%
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-300 text-sm">uPnL</span>
            <span className={`font-medium ${isUpnlPositive ? 'text-green-400' : 'text-red-400'}`}>
              ${upnl.toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
