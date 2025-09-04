export interface BreakdownItem {
  label: string
  value: string
  color: 'blue' | 'yellow' | 'purple' 
}

export interface HyperCardProps {
  userAddress: `0x${string}`
  title: string
  mainValue: string
  breakdown: BreakdownItem[]
  progressValue: number
  progressColor: 'blue' | 'yellow' | 'purple' 
}

export interface AccountData {
  totalValue: number
  breakdown: {
    perpetual: number
    spot: number
  }
  totalPositionValue: number
  withdrawable: number
  leverageRatio: number
}

export interface PositionDetailsData {
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

export interface PortfolioData {
  time: string
  value: number
}
