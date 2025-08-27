import { addresses } from '../../../config/addresses'

export function getDelegationDisplayName(delegationAddress: string | null): string {
  if (!delegationAddress || delegationAddress === addresses.common.zero) {
    return 'Not delegated (Revoke)'
  }

  // Check against known delegatee contracts
  const knownContracts = [
    { address: addresses.delegatee.metamask, name: 'MetaMask deleGator Core' },
    // Add more known contracts as needed
  ]

  const knownContract = knownContracts.find(contract =>
    contract.address.toLowerCase() === delegationAddress.toLowerCase()
  )

  return knownContract ? knownContract.name : `Delegated to ${delegationAddress.slice(0, 6)}...${delegationAddress.slice(-4)}`
}
