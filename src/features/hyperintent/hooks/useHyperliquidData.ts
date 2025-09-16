import { useState, useEffect } from 'react'

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

  // Process data based on time range and aggregation (no API call)
  const getChartData = (timeRange: string = '24H', aggregation: string = 'Combined', metric: string = 'PnL'): PortfolioData[] => {
    if (!pnlData) {
      return []
    }

    try {
      return processPnlData(pnlData, timeRange, aggregation, metric)
    } catch (err) {
      console.error('Error processing data:', err)
      return []
    }
  }

  const getCurrentPnL = (timeRange: string = '24H', aggregation: string = 'Combined', metric: string = 'PnL'): number => {
    const data = getChartData(timeRange, aggregation, metric)
    return data.length > 0 ? data[data.length - 1].value : 0
  }

  const getAPY = (timeRange: string = '24H', aggregation: string = 'Combined'): number => {
    const chartData = getChartData(timeRange, aggregation, 'PnL %')
    if (chartData.length < 2) return 0

    const firstPercentage = chartData[0].value / 100
    const lastPercentage = chartData[chartData.length - 1].value / 100
    const percentageReturn = lastPercentage - firstPercentage

    let daysInPeriod: number

    if (timeRange === 'All') {
      // Use actual timestamp difference for "All" time range
      const firstTimestamp = chartData[0].ts
      const lastTimestamp = chartData[chartData.length - 1].ts
      if (firstTimestamp && lastTimestamp) {
        const timeDiffMs = lastTimestamp - firstTimestamp
        daysInPeriod = timeDiffMs / (1000 * 60 * 60 * 24) // Convert ms to days
      } else {
        daysInPeriod = 365 // Fallback
      }
    } else {
      // Use predefined days for other time ranges
      const daysMap: { [key: string]: number } = {
        '24H': 1, '1W': 7, '1M': 30
      }
      daysInPeriod = daysMap[timeRange] || 1
    }

    const apy = Math.pow(1 + percentageReturn, 365 / daysInPeriod) - 1
    return apy * 100
  }

  const getTokenBalance = (): TokenBalance => {
    return tokenBalance.balances
  }

  return {
    getChartData,
    getCurrentPnL,
    getAPY,
    getTokenBalance,
    tokenBalance,
    clearinghouseState,
    loading,
    error
  }
}

// Helper function to process PnL data
function processPnlData(pnlData: any, timeRange: string = 'day', aggregation: string = 'Combined', metric: string = 'PnL'): PortfolioData[] {
  try {
    // PnL data is an array of [period, data] pairs
    if (Array.isArray(pnlData)) {
      // Map time range to PnL data period based on aggregation
      const periodMap: { [key: string]: string } = {
        '24H': aggregation === 'Perp Only' ? 'perpDay' : 'day',
        '1W': aggregation === 'Perp Only' ? 'perpWeek' : 'week',
        '1M': aggregation === 'Perp Only' ? 'perpMonth' : 'month',
        'All': aggregation === 'Perp Only' ? 'perpAllTime' : 'allTime'
      }

      const targetPeriod = periodMap[timeRange] || 'day'

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

              // Format time based on period
              let timeString: string
              if (timeRange === '24H') {
                timeString = date.toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: false
                })
              } else if (timeRange === '1W') {
                timeString = date.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric'
                })
              } else if (timeRange === '1M') {
                timeString = date.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric'
                })
              } else {
                timeString = date.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric'
                })
              }

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

              // Format time based on period
              let timeString: string
              if (timeRange === '24H') {
                timeString = date.toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: false
                })
              } else if (timeRange === '1W') {
                timeString = date.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric'
                })
              } else if (timeRange === '1M') {
                timeString = date.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric'
                })
              } else {
                timeString = date.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric'
                })
              }

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

// Helper function to format time for chart labels
function formatTime(index: number): string {
  const hours = ['14:00', '16:00', '18:00', '20:00', '22:00', '00:00', '02:00', '04:00', '06:00', '08:00', '10:00']
  return hours[index] || `${index}:00`
}

