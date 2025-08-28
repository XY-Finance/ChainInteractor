import { addresses } from './addresses'
import { DelegateeContract } from '../features/wallet-actions/types/eip7702'

// Centralized delegatee contract configuration
export const DELEGATEE_CONTRACTS: DelegateeContract[] = [
  {
    name: 'MetaMask deleGator Core',
    description: 'Core delegation contract for MetaMask',
    address: addresses.delegatee.metamask,
    requiresInjected: true
  },
  {
    name: 'Kernel ZeroDev 7702',
    description: 'ZeroDev delegation contract implementing EIP-7579',
    address: addresses.delegatee.kernel,
    requiresInjected: true
  },
  {
    name: 'No Delegation (Revoke)',
    description: 'Revoke current delegation (set to zero address)',
    address: addresses.common.zero,
    requiresInjected: false
  }
]

// Simplified contract mapping for display purposes
export const KNOWN_CONTRACTS = DELEGATEE_CONTRACTS.map(contract => ({
  address: contract.address,
  name: contract.name
}))

// Helper function to get contract by address
export function getContractByAddress(address: string): DelegateeContract | undefined {
  return DELEGATEE_CONTRACTS.find(contract =>
    contract.address.toLowerCase() === address.toLowerCase()
  )
}

// Helper function to get display name for delegation address
export function getDelegationDisplayName(delegationAddress: string | null): string {
  if (!delegationAddress || delegationAddress === addresses.common.zero) {
    return 'Not delegated (Revoke)'
  }

  const contract = getContractByAddress(delegationAddress)
  return contract ? contract.name : `Delegated to ${delegationAddress.slice(0, 6)}...${delegationAddress.slice(-4)}`
}
