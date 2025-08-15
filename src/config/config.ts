import { http, createConfig } from 'wagmi'
import { sepolia } from 'wagmi/chains'
import { injected, walletConnect } from 'wagmi/connectors'

// ZeroDev configuration - use environment variables
const ZERODEV_PROJECT_ID = process.env.NEXT_PUBLIC_ZERODEV_PROJECT_ID

if (!ZERODEV_PROJECT_ID) {
  console.warn('⚠️ NEXT_PUBLIC_ZERODEV_PROJECT_ID not set. ZeroDev features will be unavailable.')
}

const ZERODEV_RPC_URL = ZERODEV_PROJECT_ID
  ? `https://rpc.zerodev.app/api/v3/${ZERODEV_PROJECT_ID}/chain/11155111`
  : undefined

// WalletConnect configuration
const WALLETCONNECT_PROJECT_ID = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID

if (!WALLETCONNECT_PROJECT_ID) {
  console.warn('⚠️ NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID not set. WalletConnect will be unavailable.')
}

export const config = createConfig({
  chains: [sepolia],
  transports: {
    [sepolia.id]: ZERODEV_RPC_URL ? http(ZERODEV_RPC_URL) : http(),
  },
  connectors: [
    injected(),
    ...(WALLETCONNECT_PROJECT_ID ? [
      walletConnect({
        projectId: WALLETCONNECT_PROJECT_ID,
      })
    ] : []),
  ],
})
