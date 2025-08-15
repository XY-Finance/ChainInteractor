import { http, createConfig } from 'wagmi'
import { sepolia } from 'wagmi/chains'
import { injected, walletConnect } from 'wagmi/connectors'

// ZeroDev configuration - use environment variables
const ZERODEV_PROJECT_ID = process.env.ZERODEV_PROJECT_ID || 'demo-project-id'
const ZERODEV_RPC_URL = `https://rpc.zerodev.app/api/v3/${ZERODEV_PROJECT_ID}/chain/11155111`

export const config = createConfig({
  chains: [sepolia],
  transports: {
    [sepolia.id]: http(ZERODEV_RPC_URL),
  },
  connectors: [
    injected(),
    walletConnect({
      projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '',
    }),
  ],
})
