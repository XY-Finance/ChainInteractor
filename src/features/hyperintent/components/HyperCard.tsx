'use client'

import React from 'react'
import { HyperCardProps } from '../types'
import { useHyperliquidData } from '../hooks/useHyperliquidData'

export function HyperCard({ userAddress, title, mainValue, breakdown, progressValue, progressColor }: HyperCardProps) {
  const getColorClasses = (color: 'blue' | 'yellow' | 'purple') => {
    switch (color) {
      case 'blue':
        return {
          dot: 'bg-blue-500',
          progress: '#3B82F6',
          progressBg: '#4B5563'
        }
      case 'yellow':
        return {
          dot: 'bg-yellow-500',
          progress: '#EAB308',
          progressBg: '#4B5563'
        }
      case 'purple':
        return {
          dot: 'bg-purple-500',
          progress: '#8B5CF6',
          progressBg: '#4B5563'
        }
      default:
        return {
          dot: 'bg-gray-500',
          progress: '#6B7280',
          progressBg: '#4B5563'
        }
    }
  }

  const colors = getColorClasses(progressColor)
  const radius = 35
  const strokeWidth = 6
  const circumference = 2 * Math.PI * radius
  const strokeDasharray = circumference
  
  // To avoid NaN
  const validProgressValue = typeof progressValue === 'number' && !isNaN(progressValue) ? progressValue : 0
  const strokeDashoffset = circumference - (validProgressValue / 100) * circumference
  
  const { tokenBalance } = useHyperliquidData(userAddress)
  const isTokenBalance = title === "Account Total Value"

  const formatNumber = (value: string) => {
    const num = parseFloat(value);
    if (isNaN(num)) return '0.00';
    if (num < 0.01) return '< 0.01';
    
    return num.toFixed(2);
  };

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-3 border border-gray-700/50 shadow-2xl h-18">
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-300">{title}</h3>
      </div>

      <div className="flex h-full">
        {/* leftside content */}
        <div className="flex-1 flex flex-col justify-start pr-4">
          {/* mainValue */}
          <div className="text-2xl font-bold text-white mb-2">
            {mainValue}
          </div>

          {/* breakdown */}
          <div className="space-y-0.5">
            {breakdown.map((item, index) => {
              const isSpot = item.label === "Spot";
              return (
                <div key={index} className="flex items-center space-x-2 relative group cursor-pointer">
                  <div className={`w-1.5 h-1.5 rounded-full ${getColorClasses(item.color).dot}`}></div>
                  
                  <span className="text-gray-300 text-xs">
                    {item.label}:{" "}
                    <span className="text-white font-medium">
                      {item.value}
                    </span>

                    {/* Tooltip for Spot */}
                    {isSpot && isTokenBalance && tokenBalance?.balances && (
                      <div className="absolute bottom-full w-48 bg-gray-800/90 text-white text-xs rounded-lg shadow-lg p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
                        {tokenBalance.balances.map((token: any, idx: number) => (
                          <div key={idx} className="flex items-center space-x-2 mb-1 last:mb-0">
                            <div className="flex items-center pl-1">
                              <span className="text-green-500 text-[9px] leading-[1]">-</span>
                              <span className="ml-1">
                                {token.coin}: <span className="font-medium">{formatNumber(token.total)}</span>
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* progress circle */}
        <div className="relative flex-shrink-0">
          <svg
            className="w-24 h-24 transform -rotate-90"
            viewBox="0 0 100 100"
            style={{ overflow: 'visible' }}
          >
            <circle
              cx="50"
              cy="50"
              r={radius}
              strokeWidth={strokeWidth}
              fill="transparent"
              className="opacity-30"
              style={{ stroke: colors.progressBg }}
            />
            <circle
              cx="50"
              cy="50"
              r={radius}
              strokeWidth={strokeWidth}
              fill="transparent"
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
              style={{
                stroke: colors.progress,
                strokeDasharray: strokeDasharray,
                strokeDashoffset: strokeDashoffset
              }}
            />
          </svg>

          <div className="absolute bottom-1/4 inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center">
              <div className="text-sm font-bold text-white">
                {progressValue}%
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
