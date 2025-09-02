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
  const [hoverIndex, setHoverIndex] = useState<number | null>(null)

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
  const svgHeight = 520
  const yTop = 30
  const leftMargin = 120
  const rightMargin = 40
  const bottomMargin = 50
  const plotWidth = svgWidth - leftMargin - rightMargin
  const plotHeight = svgHeight - yTop - bottomMargin
  const plotBottom = yTop + plotHeight

  const generateTicks = (minV: number, maxV: number) => {
    const rangeV = Math.max(1, maxV - minV)
    // Base step = 10 ** (number of digits of (range/10) - 1)
    const rangeDiv10 = Math.max(1, rangeV / 10)
    const digits = Math.floor(Math.log10(rangeDiv10))
    const baseStep = Math.pow(10, Math.max(0, digits))

    const preferredCounts = [8, 9, 10, 7, 6, 11, 12]
    for (const count of preferredCounts) {
      const rawStep = rangeV / (count - 1)
      // Round step up to nearest multiple of baseStep, and never below baseStep
      const step = Math.max(baseStep, Math.ceil(rawStep / baseStep) * baseStep)
      const axisMin = Math.floor(minV / step) * step
      const axisMax = Math.ceil(maxV / step) * step
      const tickCount = Math.round((axisMax - axisMin) / step) + 1
      if (tickCount >= 6 && tickCount <= 12) {
        const ticks = Array.from({ length: tickCount }, (_, i) => axisMin + i * step)
        return { ticks, axisMin, axisMax, step }
      }
    }
    // Fallback to a reasonable tick set using baseStep
    const fallbackStep = Math.max(baseStep, Math.ceil(rangeV / (6 - 1) / baseStep) * baseStep)
    const axisMin = Math.floor(minV / fallbackStep) * fallbackStep
    const axisMax = Math.ceil(maxV / fallbackStep) * fallbackStep
    const tickCount = Math.round((axisMax - axisMin) / fallbackStep) + 1
    const ticks = Array.from({ length: tickCount }, (_, i) => axisMin + i * fallbackStep)
    return { ticks, axisMin, axisMax, step: fallbackStep }
  }

  const { ticks: yTicks, axisMin, axisMax } = generateTicks(minValue, maxValue)
  const axisRange = Math.max(1, axisMax - axisMin)
  
  // Determine line color based on latest data point
  const latestValue = chartData[chartData.length - 1]?.value || 0
  const isLatestPositive = latestValue >= 0
  const lineColor = isLatestPositive ? "#10B981" : "#EF4444" // Green for positive, Red for negative
 
  // y position for value = 0 line
  const zeroY = yTop + (1 - (0 - axisMin) / axisRange) * plotHeight

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

  // Helpers to map index->(x,y)
  const getX = (index: number) => leftMargin + (index * plotWidth) / Math.max(1, (chartData.length - 1))
  const getY = (value: number) => yTop + (1 - (value - axisMin) / axisRange) * plotHeight

  // Mouse handlers (use viewBox coordinates)
  const handleMouseMove = (evt: React.MouseEvent<SVGRectElement | SVGSVGElement>) => {
    const svg = (evt.currentTarget as SVGElement).ownerSVGElement || (evt.currentTarget as unknown as SVGSVGElement)
    if (!svg) return
    const ctm = svg.getScreenCTM()
    if (!ctm) return
    const pt = svg.createSVGPoint()
    pt.x = evt.clientX
    pt.y = evt.clientY
    const cursor = pt.matrixTransform(ctm.inverse())
    const x = cursor.x
    const idxFloat = ((x - leftMargin) / plotWidth) * (chartData.length - 1)
    const clamped = Math.min(chartData.length - 1, Math.max(0, Math.round(idxFloat)))
    setHoverIndex(clamped)
  }

  const handleMouseLeave = () => setHoverIndex(null)

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50 shadow-2xl h-97">
      {/* Top Controls */}
      <div className="mb-5">
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
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-semibold text-white">
          {selectedTimeRange} {selectedMetric} ({selectedAggregation})
        </h3>
        <div className={`text-2xl font-bold ${isPnLPositive ? 'text-green-400' : 'text-red-400'}`}>
          ${currentPnL.toLocaleString()}
        </div>
      </div>

      {/* Chart Container */}
      <div className="relative h-80">
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
              <text key={idx} x="5" y={y} className="text-lg fill-gray-400">
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

          {/* Zero line (y=0) */}
          <line
            x1={leftMargin}
            y1={zeroY}
            x2={leftMargin + plotWidth}
            y2={zeroY}
            stroke="#A78BFA"
            strokeWidth="1.5"
            strokeDasharray="6 6"
            opacity="0.5"
          />

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
              const x = getX(index)
              const y = getY(point.value)
              return `${index === 0 ? 'M' : 'L'} ${x} ${y}`
            }).join(' ') + ` L ${leftMargin + plotWidth} ${plotBottom} L ${leftMargin} ${plotBottom} Z`}
            fill="url(#chartGradient)"
          />

          {/* Line chart path */}
          <path
            d={chartData.map((point, index) => {
              const x = getX(index)
              const y = getY(point.value)
              return `${index === 0 ? 'M' : 'L'} ${x} ${y}`
            }).join(' ')}
            stroke={lineColor}
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Hover guideline and tooltip */}
          {hoverIndex !== null && chartData[hoverIndex] && (
            <g>
              <line
                x1={getX(hoverIndex)}
                y1={yTop}
                x2={getX(hoverIndex)}
                y2={plotBottom}
                stroke="#8B5CF6"
                strokeWidth="2"
                strokeDasharray="6 6"
                opacity="0.5"
              />
              <circle
                cx={getX(hoverIndex)}
                cy={getY(chartData[hoverIndex].value)}
                r="7"
                fill="#ffffff"
                stroke={lineColor}
                strokeWidth="3"
              />
              <foreignObject
                x={getX(hoverIndex) - 150}
                y={getY(chartData[hoverIndex].value) - 90}
                width="300"
                height="100"
              >
                <div className="bg-black/45 backdrop-blur-sm text-white p-4 rounded-xl shadow-2xl border border-white/20">
                  <div className="font-extrabold text-2xl leading-tight">${chartData[hoverIndex].value.toLocaleString()}</div>
                  <div className="text-gray-300 text-sm mt-1">
                    {chartData[hoverIndex].ts
                      ? new Date(chartData[hoverIndex].ts).toLocaleString('en-US', {
                          year: 'numeric', month: 'short', day: '2-digit',
                          hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
                        })
                      : chartData[hoverIndex].time}
                  </div>
                </div>
              </foreignObject>
            </g>
          )}

          {/* Hover capture overlay */}
          <rect
            x={leftMargin}
            y={yTop}
            width={plotWidth}
            height={plotHeight}
            fill="transparent"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          />

          {/* Current point marker */}
          <circle
            cx={getX(chartData.length - 1)}
            cy={getY(chartData[chartData.length - 1].value)}
            r="5"
            fill="white"
            stroke={lineColor}
            strokeWidth="2"
          />

          {/* X-axis labels - show every 3rd label to avoid crowding */}
          {chartData.map((point, index) => {
            // Only show every 3rd label to reduce crowding
            if (index % 3 !== 0 && index !== chartData.length - 1) return null
            
            const x = getX(index)
            return (
              <text
                key={index}
                x={x}
                y={svgHeight-10}
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
