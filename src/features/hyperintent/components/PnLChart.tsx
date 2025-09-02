'use client'

import React, { useState } from 'react'
import { useHyperliquidData } from '../hooks/useHyperliquidData'

interface PnLChartProps {
  userAddress?: `0x${string}`
  timeRange?: string
  pnlType?: string
  aggregation?: string
}

export function PnLChart({ 
  userAddress = "0x020ca66c30bec2c4fe3861a94e4db4a498a35872",
  timeRange = "24H",
  pnlType = "PnL",
  aggregation = "Combined"
}: PnLChartProps) {
  const [selectedTimeRange, setSelectedTimeRange] = useState('24H')
  const [selectedAggregation, setSelectedAggregation] = useState('Combined')
  const [selectedMetric, setSelectedMetric] = useState('PnL')

  // Fetch data from Hyperliquid API (only once)
  const { getChartData, getCurrentPnL, loading, error } = useHyperliquidData(userAddress)

  // Get chart data and current PnL based on selected time range, aggregation and metric
  const chartData = getChartData(selectedTimeRange, selectedAggregation, selectedMetric)
  const currentPnL = getCurrentPnL(selectedTimeRange, selectedAggregation, selectedMetric)

  // Calculate dynamic range based on actual data
  const dataMax = Math.max(...chartData.map(d => d.value))
  const dataMin = Math.min(...chartData.map(d => d.value))
  
  // Add some padding to the range for better visualization
  const padding = (dataMax - dataMin) * 0.1
  const maxValue = dataMax + padding
  const minValue = dataMin - padding
  const range = maxValue - minValue

  const isPnLPositive = currentPnL >= 0

  // Chart geometry and Y-axis ticks
  const svgWidth = 2000
  const svgHeight = 450
  const yTop = 30
  const leftMargin = 120
  const rightMargin = 40
  const bottomMargin = 70
  const plotWidth = svgWidth - leftMargin - rightMargin
  const plotHeight = svgHeight - yTop - bottomMargin
  const plotBottom = yTop + plotHeight

  const generateTicks = (minV: number, maxV: number) => {
    const rangeV = Math.max(1, maxV - minV)
    const preferredCounts = [8, 9, 10, 7, 6, 11, 12]
    for (const count of preferredCounts) {
      const rawStep = rangeV / (count - 1)
      let step = Math.max(50, Math.ceil(rawStep / 50) * 50)
      const axisMin = Math.floor(minV / step) * step
      const axisMax = Math.ceil(maxV / step) * step
      const tickCount = Math.round((axisMax - axisMin) / step) + 1
      if (tickCount >= 6 && tickCount <= 12) {
        const ticks = Array.from({ length: tickCount }, (_, i) => axisMin + i * step)
        return { ticks, axisMin, axisMax, step }
      }
    }
    // Fallback to 6 ticks
    let step = Math.max(50, Math.ceil(rangeV / (6 - 1) / 50) * 50)
    const axisMin = Math.floor(minV / step) * step
    const axisMax = Math.ceil(maxV / step) * step
    const tickCount = Math.round((axisMax - axisMin) / step) + 1
    const ticks = Array.from({ length: tickCount }, (_, i) => axisMin + i * step)
    return { ticks, axisMin, axisMax, step }
  }

  const { ticks: yTicks, axisMin, axisMax } = generateTicks(minValue, maxValue)
  const axisRange = Math.max(1, axisMax - axisMin)
  
  // Determine line color based on latest data point
  const latestValue = chartData[chartData.length - 1]?.value || 0
  const isLatestPositive = latestValue >= 0
  const lineColor = isLatestPositive ? "#10B981" : "#EF4444" // Green for positive, Red for negative

    if (loading) {
    return (
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50 shadow-2xl h-96">
        <div className="flex items-center justify-center h-full">
          <div className="text-white">Loading PnL data...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50 shadow-2xl h-96">
        <div className="flex items-center justify-center h-full">
          <div className="text-red-400">Error: {error}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50 shadow-2xl h-96">
      {/* Top Controls */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-4">
          {/* Time Range Controls */}
          <div className="flex bg-gray-700/[0.3] rounded-xl p-1 gap-1">
            {['24H', '1W', '1M', 'All'].map((range) => (
              <button
                key={range}
                onClick={() => setSelectedTimeRange(range)}
                className={`px-3 py-1.5 rounded-xl whitespace-nowrap text-xs font-medium
                  transition-all duration-200 cursor-pointer
                  ${
                    selectedTimeRange === range
                      ? 'text-purple-400 bg-purple-400/[0.08] shadow-sm shadow-purple-400/10'
                      : 'text-gray-300 hover:text-white'
                  }`}
              >
                {range}
              </button>
            ))}
          </div>

          {/* Aggregation Controls */}
          <div className="flex bg-gray-700/[0.3] rounded-xl p-1 gap-1 ml-auto">
            {['Combined', 'Perp Only'].map((agg) => (
              <button
                key={agg}
                onClick={() => setSelectedAggregation(agg)}
                className={`px-3 py-1.5 rounded-xl whitespace-nowrap text-xs font-medium
                  transition-all duration-200 cursor-pointer
                  ${
                    selectedAggregation === agg
                      ? 'text-purple-400 bg-purple-400/[0.08] shadow-sm shadow-purple-400/10'
                      : 'text-gray-300 hover:text-white'
                  }`}
              >
                {agg}
              </button>
            ))}
          </div>

          {/* Display Metric Controls */}
          <div className="flex bg-gray-700/[0.3] rounded-xl p-1 gap-1">
            {['PnL', 'Account Value'].map((metric) => (
              <button
                key={metric}
                onClick={() => setSelectedMetric(metric)}
                className={`px-3 py-1.5 rounded-xl whitespace-nowrap text-xs font-medium
                  transition-all duration-200 cursor-pointer
                  ${
                    selectedMetric === metric
                      ? 'text-purple-400 bg-purple-400/[0.08] shadow-sm shadow-purple-400/10'
                      : 'text-gray-300 hover:text-white'
                  }`}
              >
                {metric}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* PnL Summary */}
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-white">
          {selectedTimeRange} {selectedMetric} ({selectedAggregation})
        </h3>
        <div className={`text-2xl font-bold ${isPnLPositive ? 'text-green-400' : 'text-red-400'}`}>
          ${currentPnL.toLocaleString()}
        </div>
      </div>

      {/* Chart Container */}
      <div className="relative h-64">
        <svg
          className="w-full h-full"
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Background watermark */}
          <text
            x={svgWidth / 2}
            y={svgHeight / 2}
            className="text-gray-700 text-7xl font-bold"
            textAnchor="middle"
            style={{ opacity: 0.12 }}
          >
            Hyperintent.ai
          </text>

          {/* Y-axis labels */}
          {yTicks.map((value, idx) => {
            const y = yTop + (1 - (value - axisMin) / axisRange) * plotHeight
            return (
              <text key={idx} x="15" y={y} className="text-lg fill-gray-400">
                ${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </text>
            )
          })}

          {/* Grid lines */}
          {yTicks.map((value, idx) => {
            const y = yTop + (1 - (value - axisMin) / axisRange) * plotHeight
            return (
              <line
                key={idx}
                x1={leftMargin}
                y1={y}
                x2={leftMargin + plotWidth}
                y2={y}
                stroke="#374151"
                strokeWidth="0.5"
                opacity="0.3"
              />
            )
          })}

          {/* Chart area */}
                      <defs>
              <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor={lineColor} stopOpacity="0.3" />
                <stop offset="100%" stopColor={lineColor} stopOpacity="0.05" />
              </linearGradient>
            </defs>

          {/* Area chart path */}
          <path
            d={chartData.map((point, index) => {
              const x = leftMargin + (index * plotWidth) / (chartData.length - 1)
              const y = yTop + (1 - (point.value - axisMin) / axisRange) * plotHeight
              return `${index === 0 ? 'M' : 'L'} ${x} ${y}`
            }).join(' ') + ` L ${leftMargin + plotWidth} ${plotBottom} L ${leftMargin} ${plotBottom} Z`}
            fill="url(#chartGradient)"
          />

          {/* Line chart path */}
          <path
            d={chartData.map((point, index) => {
              const x = leftMargin + (index * plotWidth) / (chartData.length - 1)
              const y = yTop + (1 - (point.value - axisMin) / axisRange) * plotHeight
              return `${index === 0 ? 'M' : 'L'} ${x} ${y}`
            }).join(' ')}
            stroke={lineColor}
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data points with hover effects */}
          {chartData.map((point, index) => {
            const x = leftMargin + (index * plotWidth) / (chartData.length - 1)
            const y = yTop + (1 - (point.value - axisMin) / axisRange) * plotHeight
            return (
              <g key={index}>
                {/* Invisible larger circle for hover area */}
                <circle
                  cx={x}
                  cy={y}
                  r="8"
                  fill="transparent"
                  className="cursor-pointer hover:fill-red-500/20 transition-all duration-200"
                />
                {/* Visible data point */}
                <circle
                  cx={x}
                  cy={y}
                  r="3"
                  fill={lineColor}
                  className="transition-all duration-200"
                />
                {/* Tooltip */}
                <foreignObject
                  x={x - 50}
                  y={y - 60}
                  width="100"
                  height="40"
                  className="opacity-0 hover:opacity-100 transition-opacity duration-200 pointer-events-none"
                >
                  <div className="bg-black text-white text-xs p-2 rounded shadow-lg">
                    <div className="font-bold">${point.value.toLocaleString()}</div>
                    <div>{point.time}</div>
                  </div>
                </foreignObject>
              </g>
            )
          })}

          {/* Current point marker */}
          <circle
            cx={leftMargin + ((chartData.length - 1) * plotWidth) / (chartData.length - 1)}
            cy={yTop + (1 - (chartData[chartData.length - 1].value - axisMin) / axisRange) * plotHeight}
            r="5"
            fill="white"
            stroke={lineColor}
            strokeWidth="2"
          />

                    {/* X-axis labels - show every 3rd label to avoid crowding */}
          {chartData.map((point, index) => {
            // Only show every 3rd label to reduce crowding
            if (index % 3 !== 0 && index !== chartData.length - 1) return null
            
            const x = leftMargin + (index * plotWidth) / (chartData.length - 1)
            return (
              <text
                key={index}
                x={x}
                y={svgHeight-40}
                className="text-base fill-gray-400"
                textAnchor="middle"
              >
                {point.time}
              </text>
            )
          })}
        </svg>
      </div>
    </div>
  )
}
