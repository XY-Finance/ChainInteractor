"use client"

import React, { useState } from 'react'

interface CopyTradingModalProps {
  isOpen: boolean
  onClose: () => void
}

export function CopyTradingModal({ isOpen, onClose }: CopyTradingModalProps) {
  if (!isOpen) return null

  const [leverage, setLeverage] = useState<number>(1)

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="absolute inset-0 flex items-center justify-center p-3">
        <div className="w-full max-w-6xl max-h-[80vh] bg-gray-900/95 border border-gray-700/60 rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-700/60">
            <h2 className="text-base font-semibold text-white">Edit Copy Trading</h2>
            <button
              onClick={onClose}
              className="text-gray-300 hover:text-white transition-colors"
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          {/* Body (scrollable) */}
          <div className="p-4 overflow-y-auto" style={{ maxHeight: 'calc(80vh - 110px)' }}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Left: Portfolio summary / positions table */}
              <div>
                {/* Address input */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex-1 relative">
                    <input
                      className="w-full rounded-lg bg-gray-800/70 border border-gray-700/60 text-white px-3 py-2.5 pr-9 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400/40"
                      placeholder="0x02... Search trader address"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
                  </div>
                </div>

                {/* Summary cards */}
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="rounded-lg bg-gray-800/60 border border-gray-700/60 p-3">
                    <div className="text-xs text-gray-400 mb-0.5">Total Position Value</div>
                    <div className="text-lg font-bold text-white">$ 139,293,000.4115</div>
                  </div>
                  <div className="rounded-lg bg-gray-800/60 border border-gray-700/60 p-3">
                    <div className="text-xs text-gray-400 mb-0.5">uPnL</div>
                    <div className="text-lg font-bold text-red-400">$ -1,590,841.19</div>
                  </div>
                </div>

                {/* Positions table */}
                <div className="rounded-lg bg-gray-800/60 border border-gray-700/60 overflow-hidden">
                  <div className="grid grid-cols-12 px-3 py-2.5 text-[11px] text-gray-400 border-b border-gray-700/60">
                    <div className="col-span-4">Symbol</div>
                    <div className="col-span-5">Position Value</div>
                    <div className="col-span-3">uPnL</div>
                  </div>
                  {/* Rows (static placeholders for now) */}
                  {[
                    { tag: 'Long', sym: 'ETH', lev: 'Isolated 15x', value: '$ 119,686,396.01', sub: '27,270.8704 ETH', pnl: '$ -1,374,626.92', pct: '-17.2300 %' },
                    { tag: 'Long', sym: 'HYPE', lev: 'Isolated 10x', value: '$ 19,500,615.00', sub: '435,000.00 HYPE', pnl: '$ -215,579.58', pct: '-11.0600 %' },
                    { tag: 'Long', sym: 'YZY', lev: 'Isolated 3x', value: '$ 105,989.40', sub: '220,000 YZY', pnl: '$ -634.69', pct: '-1.8000 %' },
                  ].map((r, i) => (
                    <div key={i} className="grid grid-cols-12 px-3 py-2.5 items-center border-b border-gray-700/40 last:border-b-0">
                      <div className="col-span-4 flex items-center gap-2.5">
                        <span className="px-1.5 py-0.5 rounded-md bg-green-600 text-white text-[9px] font-semibold uppercase">{r.tag}</span>
                        <div>
                          <div className="text-white text-sm font-semibold leading-tight">{r.sym}</div>
                          <div className="text-gray-400 text-[10px] leading-tight">{r.lev}</div>
                        </div>
                      </div>
                      <div className="col-span-5">
                        <div className="text-white text-sm font-semibold leading-tight">{r.value}</div>
                        <div className="text-gray-400 text-[10px] leading-tight">{r.sub}</div>
                      </div>
                      <div className="col-span-3 text-right">
                        <div className="text-red-400 text-sm font-semibold leading-tight">{r.pnl}</div>
                        <div className="text-red-400 text-[10px] leading-tight">{r.pct}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right: Controls */}
              <div>
                {/* Select Own Address */}
                <div className="rounded-lg bg-gray-800/60 border border-gray-700/60 p-3 mb-3">
                  <div className="text-xs text-gray-400 mb-1.5">Select Own Addresses</div>
                  <div className="flex items-center justify-between rounded-md bg-gray-900/60 border border-gray-700/60 px-3 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-purple-500/20 text-purple-300 text-xs">✦</span>
                      <div className="text-white text-sm font-semibold">0x91F2...d1ED</div>
                      <span className="text-gray-400 text-[11px]">User name</span>
                    </div>
                    <div className="text-white text-sm">$ 0.00</div>
                  </div>
                </div>

                {/* Strategy */}
                <div className="rounded-lg bg-gray-800/60 border border-gray-700/60 p-3 mb-3">
                  <div className="text-sm text-gray-300 mb-2">Trade Strategy</div>
                  <div className="grid grid-cols-2 gap-2">
                    <button className="px-3 py-2 rounded-lg text-sm font-medium text-white bg-purple-500/10 border border-purple-500/30 hover:bg-purple-500/20 transition">Trend Following</button>
                    <button className="px-3 py-2 rounded-lg text-sm font-medium text-gray-300 bg-gray-900/40 border border-gray-700/60 hover:border-gray-600 transition">Hedging</button>
                  </div>
                </div>

                {/* Leverage */}
                <div className="rounded-lg bg-gray-800/60 border border-gray-700/60 p-3 mb-3">
                  <div className="text-sm text-gray-300 mb-2">Leverage</div>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min={1}
                      max={40}
                      step={1}
                      value={leverage}
                      onChange={(e) => setLeverage(parseInt(e.target.value))}
                      className="w-full accent-purple-500"
                    />
                    <div className="w-12 text-center text-white text-sm bg-gray-900/50 border border-gray-700/60 rounded-md py-1">{leverage}x</div>
                  </div>
                  <div className="flex items-center justify-between text-gray-400 text-[11px] mt-1.5">
                    {[1,10,20,30,40].map(v => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setLeverage(v)}
                        className={`px-1 mr-14 rounded-sm transition-colors ${leverage===v ? 'text-purple-300' : 'hover:text-gray-200'}`}
                      >
                        {v}x
                      </button>
                    ))}
                  </div>
                </div>

                {/* Follow Buy Mode */}
                <div className="rounded-lg bg-gray-800/60 border border-gray-700/60 p-3 mb-3">
                  <div className="text-sm text-gray-300 mb-2">Follow Buy Mode</div>
                  <div className="grid grid-cols-3 gap-2">
                    <button className="px-3 py-2 rounded-lg text-sm font-medium text-white bg-gray-900/40 border border-gray-700/60 hover:border-gray-600">Fixed</button>
                    <button className="px-3 py-2 rounded-lg text-sm font-medium text-purple-300 bg-purple-500/10 border border-purple-500/30">Proportional</button>
                    <button className="px-3 py-2 rounded-lg text-sm font-medium text-gray-300 bg-gray-900/40 border border-gray-700/60 hover:border-gray-600">Maximum</button>
                  </div>
                </div>

                {/* Follow Sell Mode */}
                <div className="rounded-lg bg-gray-800/60 border border-gray-700/60 p-3 mb-3">
                  <div className="text-sm text-gray-300 mb-2">Follow Sell Mode</div>
                  <div className="grid grid-cols-4 gap-2">
                    <button className="px-3 py-2 rounded-lg text-sm font-medium text-white bg-gray-900/40 border border-gray-700/60 hover:border-gray-600">Not to Sell</button>
                    <button className="px-3 py-2 rounded-lg text-sm font-medium text-white bg-gray-900/40 border border-gray-700/60 hover:border-gray-600">Sell Principal at 2x</button>
                    <button className="px-3 py-2 rounded-lg text-sm font-medium text-purple-300 bg-purple-500/10 border border-purple-500/30">Proportional</button>
                    <button className="px-3 py-2 rounded-lg text-sm font-medium text-white bg-gray-900/40 border border-gray-700/60 hover:border-gray-600">TP/SL</button>
                  </div>
                </div>

                {/* Note */}
                <div className="rounded-lg bg-gray-800/60 border border-gray-700/60 p-3 mb-3">
                  <div className="text-sm text-gray-300 mb-2">Note</div>
                  <input className="w-full rounded-md bg-gray-900/50 border border-gray-700/60 text-white px-3 py-2 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400/40" placeholder="(Optional)" />
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-5 pb-5">
            <button className="w-full py-2.5 rounded-lg font-bold text-white bg-gradient-to-r from-purple-600 via-pink-400 to-yellow-200 hover:opacity-95 animate-gradient bg-[length:200%_200%]">
              Create
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
