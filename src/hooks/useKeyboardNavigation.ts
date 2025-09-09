import { useCallback } from 'react'
import { isAddress } from 'viem'

export interface AddressItem {
  path: string
  label: string
  address: string
  category: string
}

export interface UseKeyboardNavigationProps {
  searchTerm: string
  selectedIndex: number
  allFilteredAddresses: AddressItem[]
  onSelect: (address: string, label: string) => void
  onClear: () => void
  onIndexChange: (index: number) => void
  onClose?: () => void // Optional for components that can close
}

export const useKeyboardNavigation = ({
  searchTerm,
  selectedIndex,
  allFilteredAddresses,
  onSelect,
  onClear,
  onIndexChange,
  onClose
}: UseKeyboardNavigationProps) => {
  const handleSearchKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      const trimmedSearch = searchTerm.trim()

      // If there's only one result, select it automatically
      if (allFilteredAddresses.length === 1) {
        const singleAddr = allFilteredAddresses[0]
        onSelect(singleAddr.address, `${singleAddr.category}.${singleAddr.label}`)
        return
      }

      // If there's a selected item, select it
      if (selectedIndex >= 0 && selectedIndex < allFilteredAddresses.length) {
        const selectedAddr = allFilteredAddresses[selectedIndex]
        onSelect(selectedAddr.address, `${selectedAddr.category}.${selectedAddr.label}`)
        return
      }

      // If search term is a valid address, select it
      if (trimmedSearch && isAddress(trimmedSearch)) {
        onSelect(trimmedSearch, trimmedSearch)
      }
    } else if (e.key === 'Tab') {
      e.preventDefault()
      if (allFilteredAddresses.length > 0) {
        const nextIndex = selectedIndex < allFilteredAddresses.length - 1 ? selectedIndex + 1 : 0
        onIndexChange(nextIndex)
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (allFilteredAddresses.length > 0) {
        const nextIndex = selectedIndex < allFilteredAddresses.length - 1 ? selectedIndex + 1 : 0
        onIndexChange(nextIndex)
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (allFilteredAddresses.length > 0) {
        const prevIndex = selectedIndex > 0 ? selectedIndex - 1 : allFilteredAddresses.length - 1
        onIndexChange(prevIndex)
      }
    } else if (e.key === 'Escape') {
      onClear()
      onIndexChange(-1)
      onClose?.() // Call onClose if provided (for dropdowns)
    }
  }, [searchTerm, selectedIndex, allFilteredAddresses, onSelect, onClear, onIndexChange, onClose])

  return { handleSearchKeyDown }
}
