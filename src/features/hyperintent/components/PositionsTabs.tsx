"use client"

import React, { useMemo, useState } from 'react'

type AssetPosition = {
  type: string
  position: {
    coin: string
    szi: string
    leverage: { type: string; value: number }
    entryPx: string
    positionValue: string
    unrealizedPnl: string
    returnOnEquity: string
    liquidationPx: string | null
    marginUsed: string
    maxLeverage: number
    cumFunding: { allTime: string; sinceOpen: string; sinceChange: string }
  }
}

interface PositionsTabsProps {
  assetPositions?: AssetPosition[]
}

type SortKey = 'asset' | 'type' | 'positionValue' | 'unrealizedPnl' | 'entryPrice' | 'liqPrice' | 'marginUsed' | 'funding'

enum SortDir {
  ASC = 'asc',
  DESC = 'desc'
}

export function PositionsTabs({ assetPositions = [] }: PositionsTabsProps) {
  const [sortKey, setSortKey] = useState<SortKey>('asset')
  const [sortDir, setSortDir] = useState<SortDir>(SortDir.ASC)

  const rows = assetPositions

  const formatUSD = (num: number) => `$${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  const formatNum = (num: number, digits = 2) => num.toLocaleString(undefined, { minimumFractionDigits: digits, maximumFractionDigits: digits })
  const cap = (s?: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '')

  const toggleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir((prev) => (prev === SortDir.ASC ? SortDir.DESC : SortDir.ASC))
    } else {
      setSortKey(key)
      setSortDir(SortDir.ASC)
    }
  }

  const sortedRows = useMemo(() => {
    const arr = [...rows]
    const getVal = (r: AssetPosition): number | string => {
      const p = r.position
      switch (sortKey) {
        case 'asset':
          return p.coin
        case 'type':
          return p.leverage?.type || ''
        case 'positionValue':
          return Number(p.positionValue)
        case 'unrealizedPnl':
          return Number(p.unrealizedPnl)
        case 'entryPrice':
          return Number(p.entryPx)
        case 'liqPrice':
          return p.liquidationPx == null ? Number.NEGATIVE_INFINITY : Number(p.liquidationPx)
        case 'marginUsed':
          return Number(p.marginUsed)
        case 'funding':
          return Number(p.cumFunding?.sinceOpen ?? 0)
        default:
          return 0
      }
    }
    arr.sort((a, b) => {
      const va = getVal(a)
      const vb = getVal(b)
      let cmp = 0
      if (typeof va === 'string' || typeof vb === 'string') {
        cmp = String(va).localeCompare(String(vb))
      } else {
        cmp = (va as number) - (vb as number)
      }
      return sortDir === SortDir.ASC ? cmp : -cmp
    })
    return arr
  }, [rows, sortKey, sortDir])

  const indicator = (key: SortKey) => (
    <span className={`ml-1 text-xs ${sortKey === key ? 'text-purple-300' : 'text-gray-500'}`}>
      {sortKey === key ? (sortDir === SortDir.ASC ? '▲' : '▼') : ''}
    </span>
  )

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-4 border border-gray-700/50 shadow-2xl">
      {/* Tabs */}
      <div className="flex items-center gap-2 mb-4">
        <button className="px-3 py-1.5 rounded-xl text-sm font-medium text-purple-300 bg-purple-500/10 border border-purple-500/30">Asset Positions</button>
        <button className="px-3 py-1.5 rounded-xl text-sm font-medium text-gray-400 bg-gray-700/20 border border-gray-700/50 cursor-not-allowed opacity-50">Open Orders</button>
        <button className="px-3 py-1.5 rounded-xl text-sm font-medium text-gray-400 bg-gray-700/20 border border-gray-700/50 cursor-not-allowed opacity-50">Recent Fills</button>
        <button className="px-3 py-1.5 rounded-xl text-sm font-medium text-gray-400 bg-gray-700/20 border border-gray-700/50 cursor-not-allowed opacity-50">Completed Trades</button>
        <button className="px-3 py-1.5 rounded-xl text-sm font-medium text-gray-400 bg-gray-700/20 border border-gray-700/50 cursor-not-allowed opacity-50">TWAP</button>
        <button className="px-3 py-1.5 rounded-xl text-sm font-medium text-gray-400 bg-gray-700/20 border border-gray-700/50 cursor-not-allowed opacity-50">Deposits & Withdrawals</button>
        <div className="ml-auto flex bg-gray-700/[0.3] rounded-xl p-0.5">
          <button className="px-3 py-1.5 rounded-xl text-sm font-medium text-purple-300 bg-purple-500/10 border border-purple-500/30">Perpetual</button>
          <button className="px-3 py-1.5 rounded-xl text-sm font-medium text-gray-400 cursor-not-allowed">Spot</button>
        </div>
      </div>

      {/* Header */}
      <div className="grid [grid-template-columns:1.4fr_1fr_2.4fr_1.8fr_1.2fr_1.2fr_1.5fr_1.5fr] text-gray-400 text-sm px-3 py-2 border-b border-gray-700/50">
        <button onClick={() => toggleSort('asset')} className="text-left hover:text-purple-300 transition-colors">Asset{indicator('asset')}</button>
        <button onClick={() => toggleSort('type')} className="text-left hover:text-purple-300 transition-colors">Type{indicator('type')}</button>
        <button onClick={() => toggleSort('positionValue')} className="text-left hover:text-purple-300 transition-colors">Position Value / Size{indicator('positionValue')}</button>
        <button onClick={() => toggleSort('unrealizedPnl')} className="text-left hover:text-purple-300 transition-colors">Unrealized PnL{indicator('unrealizedPnl')}</button>
        <button onClick={() => toggleSort('entryPrice')} className="text-left hover:text-purple-300 transition-colors">Entry Price{indicator('entryPrice')}</button>
        <button onClick={() => toggleSort('liqPrice')} className="text-left hover:text-purple-300 transition-colors">Liq. Price{indicator('liqPrice')}</button>
        <button onClick={() => toggleSort('marginUsed')} className="text-right hover:text-purple-300 transition-colors">Margin Used{indicator('marginUsed')}</button>
        <button onClick={() => toggleSort('funding')} className="text-right hover:text-purple-300 transition-colors">Funding{indicator('funding')}</button>
      </div>

      {/* Rows */}
      <div>
        {sortedRows.length === 0 && (
          <div className="px-3 py-6 text-center text-gray-400">No positions</div>
        )}
        {sortedRows.map((r, i) => {
          const p = r.position
          const lev = p.leverage?.value ?? 0
          const levType = cap(p.leverage?.type)
          const isLong = true // API only shows oneWay; assuming long for now
          const pv = Number(p.positionValue)
          const szi = Number(p.szi)
          const upnl = Number(p.unrealizedPnl)
          const entry = Number(p.entryPx)
          const liq = p.liquidationPx == null ? null : Number(p.liquidationPx)
          const margin = Number(p.marginUsed)
          const funding = Number(p.cumFunding?.sinceOpen ?? 0)
          const upnlColor = upnl >= 0 ? 'text-green-400' : 'text-red-400'

          return (
            <div key={i} className="grid [grid-template-columns:1.4fr_1fr_2.4fr_1.8fr_1.2fr_1.2fr_1.5fr_1.5fr] items-center px-3 py-3 border-b border-gray-700/30 last:border-b-0 rounded-md hover:bg-white/10 transition-colors">
              <div>
                <div className="text-white font-semibold">{p.coin}</div>
                <div className="text-gray-400 text-xs">{levType ? `${levType} ${lev}x` : `${lev}x`}</div>
              </div>
              <div>
                <span className="px-2 py-0.5 rounded-md bg-green-600 text-white text-[10px] font-semibold uppercase">{isLong ? 'LONG' : 'SHORT'}</span>
              </div>
              <div>
                <div className="text-white font-semibold">{formatUSD(pv)}</div>
                <div className="text-gray-400 text-xs">{formatNum(szi, 2)} {p.coin}</div>
              </div>
              <div>
                <div className={`font-semibold ${upnlColor}`}>{formatUSD(upnl)}</div>
                <div className={`${upnlColor} text-xs`}>{formatNum(Number(p.returnOnEquity) * 100, 2)}%</div>
              </div>
              <div className="text-white">{formatUSD(entry)}</div>
              <div className="text-white">{liq == null ? '-' : formatUSD(liq)}</div>
              <div className="text-right text-white">{formatUSD(margin)}</div>
              <div className="text-right text-red-400">{formatUSD(-Math.abs(funding))}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
