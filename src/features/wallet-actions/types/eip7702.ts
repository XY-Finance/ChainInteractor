export interface DelegateeContract {
  name: string
  description: string
  address: string
  requiresInjected: boolean
}

export interface AuthorizationData {
  address: `0x${string}`
  chainId: number
  contractAddress: string
  executor: 'self'
}

export interface SignedAuthorization {
  address?: string
  signer?: string
  contractAddress?: string
  delegatedContract?: string
  chainId: number
  nonce: number
  r: string
  s: string
  yParity: number
}

export interface VerificationResult {
  signerAddress: string
  recoveredAddress: string
  addressesMatch: boolean
}
