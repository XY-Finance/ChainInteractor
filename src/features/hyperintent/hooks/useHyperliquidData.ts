import { useState, useEffect, useCallback } from 'react'

interface PortfolioData {
  time: string
  value: number
  ts?: number
}

interface TokenBalance {
  balances: Array<{
    coin: string
    token: number
    total: string
    hold: string
    entryNtl: string
  }>
}

export function useHyperliquidData(userAddress: `0x${string}`) {
  const [pnlData, setPnlData] = useState<any>(null)
  const [tokenBalance, setTokenBalance] = useState<any>(null)
  const [clearinghouseState, setClearinghouseState] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPnlData = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch('https://api.hyperliquid.xyz/info', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'portfolio',
            user: userAddress
          })
        })

        if (!response.ok) {
          console.error(`HTTP error! status: ${response.status}`)
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()

        if (data) {
          setPnlData(data)
        } else {
          console.error('No data received from PnL data API')
          throw new Error('No data received from PnL data API')
        }
      } catch (err) {
        console.error('Error fetching data:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch data')
      } finally {
        setLoading(false)
      }
    }

    const fetchTokenBalance = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch('https://api.hyperliquid.xyz/info', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'spotClearinghouseState',
            user: userAddress
          })
        })

        if (!response.ok) {
          console.error(`HTTP error! status: ${response.status}`)
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()

        if (data) {
          setTokenBalance(data)
        } else {
          console.error('No data received from fetchTokenBalance API')
          throw new Error('No data received from fetchTokenBalance API')
        }
      } catch (err) {
        console.error('Error fetching data:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch data')
      } finally {
        setLoading(false)
      }
    }

    const fetchClearinghouseState = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch('https://api.hyperliquid.xyz/info', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'clearinghouseState',
            user: userAddress
          })
        })

        if (!response.ok) {
          console.error(`HTTP error! status: ${response.status}`)
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()

        if (data) {
          setClearinghouseState(data)
        } else {
          console.error('No data received from clearinghouseState API')
          throw new Error('No data received from clearinghouseState API')
        }
      } catch (err) {
        console.error('Error fetching data:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch data')
      } finally {
        setLoading(false)
      }
    }

    if (userAddress) {
      fetchPnlData()
      fetchTokenBalance()
      fetchClearinghouseState()
    }
  }, [userAddress])


  // Get all-time data and filter by date range
  const getFilteredChartData = useCallback((startDate: Date, endDate: Date, aggregation: string = 'Combined', metric: string = 'PnL'): PortfolioData[] => {
    if (!pnlData) {
      return []
    }

    try {
      // Always get all-time data
      const allTimeData = processPnlData(pnlData, aggregation, metric)

      // Filter by date range - use the exact dates passed in
      const startOfDay = new Date(startDate)
      startOfDay.setHours(0, 0, 0, 0)
      const endOfDay = new Date(endDate)
      endOfDay.setHours(23, 59, 59, 999)

      const filteredData = allTimeData.filter(dataPoint => {
        if (!dataPoint.ts) return false
        const pointDate = new Date(dataPoint.ts)
        return pointDate >= startOfDay && pointDate <= endOfDay
      })
      return filteredData
    } catch (err) {
      console.error('Error processing filtered data:', err)
      return []
    }
  }, [pnlData])


  // Calculate APY for custom date range
  const getAPYForDateRange = (startDate: Date, endDate: Date, aggregation: string = 'Combined'): number => {
    const chartData = getFilteredChartData(startDate, endDate, aggregation, 'PnL %')
    if (chartData.length < 2) return 0

    const firstPercentage = chartData[0].value / 100
    const lastPercentage = chartData[chartData.length - 1].value / 100
    const percentageReturn = lastPercentage - firstPercentage

    // Calculate actual days in the selected range
    const timeDiffMs = endDate.getTime() - startDate.getTime()
    const daysInPeriod = timeDiffMs / (1000 * 60 * 60 * 24)

    const apy = Math.pow(1 + percentageReturn, 365 / daysInPeriod) - 1
    return apy * 100
  }


  // Get the date range limits from the data
  const getDataDateRange = (aggregation: string = 'Combined'): { minDate: Date, maxDate: Date } => {
    const allTimeData = processPnlData(pnlData, aggregation, 'PnL')

    if (allTimeData.length === 0) {
      const today = new Date()
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(today.getDate() - 30)
      return { minDate: thirtyDaysAgo, maxDate: today }
    }

    const timestamps = allTimeData
      .map(d => d.ts)
      .filter(ts => ts !== undefined)
      .sort((a, b) => a - b)

    return {
      minDate: new Date(timestamps[0]),
      maxDate: new Date(timestamps[timestamps.length - 1])
    }
  }

  return {
    getFilteredChartData,
    getAPYForDateRange,
    getDataDateRange,
    tokenBalance,
    clearinghouseState,
    loading,
    error
  }
}

// Helper function to process all-time PnL data
function processPnlData(pnlData: any, aggregation: string = 'Combined', metric: string = 'PnL'): PortfolioData[] {
  try {
    // PnL data is an array of [period, data] pairs
    if (Array.isArray(pnlData)) {
      // Always get all-time data
      const targetPeriod = aggregation === 'Perp Only' ? 'perpAllTime' : 'allTime'

      // Find the data for the selected period
      const periodData = pnlData.find(([period]) => period === targetPeriod)

      if (periodData && periodData[1]) {
        // Handle PnL % calculation
        if (metric === 'PnL %') {
          const pnlHistory = periodData[1]['pnlHistory']
          const accountValueHistory = periodData[1]['accountValueHistory']

          if (pnlHistory && accountValueHistory) {
            // Convert timestamp and data to chart format with percentage calculation
            return pnlHistory.map(([timestamp, pnlValue]: [number, string], index: number) => {
              const date = new Date(timestamp)

              // Find corresponding account value for the same timestamp
              const accountValueEntry = accountValueHistory.find(([ts]: [number, string]) => ts === timestamp)
              const accountValue = accountValueEntry ? parseFloat(accountValueEntry[1]) : 0
              const pnl = parseFloat(pnlValue)

              // Calculate percentage: (PnL / Account Value) * 100 with higher precision
              const percentage = accountValue !== 0 ? (pnl / accountValue) * 100 : 0

              // Format time for all-time data
              const timeString = date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric'
              })

              return {
                time: timeString,
                value: percentage,
                ts: timestamp
              }
            })
          }
        } else {
          // Choose data source based on metric
          const dataSource = metric === 'Account Value' ? 'accountValueHistory' : 'pnlHistory'
          const historyData = periodData[1][dataSource]

          if (historyData) {
            // Convert timestamp and data to chart format
            return historyData.map(([timestamp, value]: [number, string]) => {
              const date = new Date(timestamp)

              // Format time for all-time data
              const timeString = date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric'
              })

              return {
                time: timeString,
                value: parseFloat(value),
                ts: timestamp
              }
            })
          }
        }
      }
    }

    // If no valid data found, return empty array
    return []
  } catch (err) {
    console.error('Error processing PnL data:', err)
    return []
  }
}


