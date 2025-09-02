import { useState, useEffect } from 'react'

interface PortfolioData {
  time: string
  value: number
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
      return getSampleData()
    }
    
    try {
      return processPnlData(pnlData, timeRange, aggregation, metric)
    } catch (err) {
      console.error('Error processing data:', err)
      return getSampleData()
    }
  }

  const getCurrentPnL = (timeRange: string = '24H', aggregation: string = 'Combined', metric: string = 'PnL'): number => {
    const data = getChartData(timeRange, aggregation, metric)
    return data.length > 0 ? data[data.length - 1].value : 0
  }

  const getTokenBalance = (): TokenBalance => {
    return tokenBalance.balances
  }

  return {
    getChartData,
    getCurrentPnL,
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
              value: parseFloat(value)
            }
          })
        }
      }
    }
    
    // If no valid data found, return sample data
    return getSampleData()
  } catch (err) {
    console.error('Error processing PnL data:', err)
    return getSampleData()
  }
}

// Helper function to format time for chart labels
function formatTime(index: number): string {
  const hours = ['14:00', '16:00', '18:00', '20:00', '22:00', '00:00', '02:00', '04:00', '06:00', '08:00', '10:00']
  return hours[index] || `${index}:00`
}

// Fallback sample data
function getSampleData(): PortfolioData[] {
  return [
    { time: '14:00', value: -50 },
    { time: '16:00', value: -30 },
    { time: '18:00', value: 50 },
    { time: '20:00', value: 100 },
    { time: '22:00', value: -200 },
    { time: '00:00', value: -400 },
    { time: '02:00', value: -550 },
    { time: '04:00', value: -450 },
    { time: '06:00', value: -700 },
    { time: '08:00', value: -850 },
    { time: '10:00', value: -959.25 }
  ]
}
