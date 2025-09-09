'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { isAddress } from 'viem'
import { kol as configAddresses } from '@/config/addresses'

interface TraderSelectorProps {
	value: string
	onChange: (address: string) => void
	className?: string
	defaultValue?: string
}

export default function TraderSelector({ value, onChange, className = '', defaultValue }: TraderSelectorProps) {
	const [inputValue, setInputValue] = useState<string>(value || '')
	const [isValidAddress, setIsValidAddress] = useState(true)
	const [isDropdownOpen, setIsDropdownOpen] = useState(false)
	const [selectedIndex, setSelectedIndex] = useState(-1)
	const dropdownRef = useRef<HTMLDivElement>(null)
	const inputRef = useRef<HTMLInputElement>(null)
	const [shouldShake, setShouldShake] = useState(false)

	// (Removed) Do not auto-fill from defaultValue; start empty unless controlled via value

	// Sync external value into input
	useEffect(() => {
		if (value !== inputValue) {
			setInputValue(value || '')
		}
	}, [value])

	const placeholderTexts = useMemo(
		() => [
			'Enter trader address...',
			'Track wallet address...',
			'Discover trader portfolio...',
			'Search address 0x1234...',
			'Explore new portfolio...'
		],
		[]
	)
	const [currentPlaceholderIndex, setCurrentPlaceholderIndex] = useState(0)
	const REPEAT = 100
	const repeatedPlaceholders = useMemo(
		() => Array.from({ length: REPEAT }).flatMap(() => placeholderTexts),
		[placeholderTexts]
	)
	const maxIndex = placeholderTexts.length * REPEAT
	useEffect(() => {
		const interval = setInterval(() => {
			setCurrentPlaceholderIndex(prev => (prev + 1) % maxIndex)
		}, 3000)
		return () => clearInterval(interval)
	}, [maxIndex])

	// localStorage recent list
	const saveRecentAddress = (addr: string) => {
		if (!isAddress(addr)) return
		const key = 'recent_addresses'
		const recent = JSON.parse(localStorage.getItem(key) || '[]')
		const updated = [addr, ...recent.filter((v: string) => v !== addr)].slice(0, 3)
		localStorage.setItem(key, JSON.stringify(updated))
	}
	const getRecentAddresses = (): string[] => {
		const key = 'recent_addresses'
		const list = JSON.parse(localStorage.getItem(key) || '[]')
		return list.filter((v: string) => isAddress(v))
	}

	// Flatten config addresses
	const allConfigAddresses = useMemo(() => {
		const set = new Set<string>()
		const items: Array<{ path: string; label: string; address: string }> = []
		Object.entries(configAddresses).forEach(([category, catData]) => {
			if (typeof catData === 'object' && catData) {
				Object.entries(catData).forEach(([k, v]) => {
					if (typeof v === 'string') {
						items.push({ path: `${category}.${k}`, label: k, address: v })
						set.add(v.toLowerCase())
					} else if (typeof v === 'object' && v) {
						Object.entries(v).forEach(([subK, subV]) => {
							if (typeof subV === 'string') {
								items.push({ path: `${category}.${k}.${subK}`, label: `${k}.${subK}`, address: subV })
								set.add(subV.toLowerCase())
							}
						})
					}
				})
			}
		})
		return { items, set }
	}, [])

	const recentAddresses = useMemo(
		() => getRecentAddresses().filter(a => !allConfigAddresses.set.has(a.toLowerCase())),
		[inputValue, allConfigAddresses.set]
	)

	const filteredAddresses = useMemo(() => {
		const term = inputValue.trim().toLowerCase()
		const match = (label: string, addr: string) => label.toLowerCase().includes(term) || addr.toLowerCase().includes(term)
		const config = allConfigAddresses.items.filter(i => match(i.label, i.address))
		const recent = recentAddresses
			.filter(a => match(a, a))
			.map(a => ({ path: `recent.${a}`, label: a, address: a }))
		const combined = [
			{ category: 'recent', addresses: recent },
			{ category: 'config', addresses: config }
		].filter(c => c.addresses.length > 0)
		return { combined, flat: combined.flatMap(c => c.addresses) }
	}, [inputValue, allConfigAddresses.items, recentAddresses])

	// Close on outside click
	useEffect(() => {
		const onDoc = (e: MouseEvent) => {
			if (
				dropdownRef.current &&
				!dropdownRef.current.contains(e.target as Node) &&
				inputRef.current &&
				!inputRef.current.contains(e.target as Node)
			) {
				setIsDropdownOpen(false)
				setSelectedIndex(-1)
			}
		}
		document.addEventListener('mousedown', onDoc)
		return () => document.removeEventListener('mousedown', onDoc)
	}, [])

	return (
		<div className={`relative ${className} ${isDropdownOpen ? 'z-[5]' : ''}`} ref={dropdownRef}>
			<input
				type="text"
				placeholder=" "
				value={inputValue}
				ref={inputRef}
				onChange={(e) => {
					const val = e.target.value
					setInputValue(val)
					setIsDropdownOpen(true)
					setSelectedIndex(-1)
				}}
				onKeyDown={(e) => {
					if (e.key === 'ArrowDown') {
						e.preventDefault()
						const max = filteredAddresses.flat.length
						if (max > 0) setSelectedIndex(prev => (prev + 1) % max)
						setIsDropdownOpen(true)
					} else if (e.key === 'ArrowUp') {
						e.preventDefault()
						const max = filteredAddresses.flat.length
						if (max > 0) setSelectedIndex(prev => (prev - 1 + max) % max)
					} else if (e.key === 'Tab') {
						const max = filteredAddresses.flat.length
						if (max > 0) setSelectedIndex(prev => (prev + 1) % max)
					} else if (e.key === 'Enter') {
						const picked =
							selectedIndex >= 0 && selectedIndex < filteredAddresses.flat.length
								? filteredAddresses.flat[selectedIndex].address
								: inputValue.trim()
						const valid = picked === '' || isAddress(picked as `0x${string}`)
						setIsValidAddress(valid)
						if (valid) {
							onChange(picked)
							setInputValue(picked)
							if (picked) saveRecentAddress(picked)
							setIsDropdownOpen(false)
						} else {
							setShouldShake(true)
							setTimeout(() => setShouldShake(false), 320)
						}
					} else if (e.key === 'Escape') {
						setIsDropdownOpen(false)
						setSelectedIndex(-1)
					}
				}}
				onBlur={() => {
					const val = inputValue.trim()
					const valid = val === '' || isAddress(val as `0x${string}`)
					setIsValidAddress(valid)
					if (!valid) {
						setShouldShake(true)
						setTimeout(() => setShouldShake(false), 320)
					}
				}}
				className={`w-full px-3 py-2 pl-10 bg-white/20 backdrop-blur-sm rounded-full border focus:outline-none focus:ring-2 focus:ring-white/50 text-white placeholder-white/60 text-sm transition-colors duration-200 ${
					isValidAddress ? 'border-white/30 focus:border-white/50' : 'border-red-400/50 focus:border-red-400/70'
				}
				${shouldShake ? ' shake' : ''}`}
				onFocus={() => setIsDropdownOpen(true)}
			/>

			{/* Animated placeholder */}
			{inputValue === '' && (
				<div className="absolute left-10 top-2 transform pointer-events-none overflow-hidden h-5">
					<div
						className="transition-transform duration-700 ease-in-out"
						style={{ transform: `translateY(-${(currentPlaceholderIndex % maxIndex) * 20}px)` }}
					>
						{repeatedPlaceholders.map((text, index) => (
							<div key={index} className="h-5 flex items-center text-white/60 text-sm">
								{text}
							</div>
						))}
					</div>
				</div>
			)}

			{/* Search Icon */}
			<div className="absolute left-4 top-3 transform">
				<svg className="w-4 h-4 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
				</svg>
			</div>

			{/* Dropdown */}
			{isDropdownOpen && (
				<div className="absolute z-[1000] mt-2 w-full bg-gray-900/90 backdrop-blur-md border border-white/10 rounded-xl shadow-2xl overflow-hidden">
					<div className="max-h-60 overflow-y-auto">
						{filteredAddresses.combined.length === 0 ? (
							<div className="px-3 py-3 text-sm text-gray-400">No matches.</div>
						) : (
							filteredAddresses.combined.map(({ category, addresses }) => (
								<div key={category}>
									<div className="px-3 py-1 text-xs uppercase tracking-wider text-purple-300/70 bg-white/5 border-b border-white/10">
										{category === 'recent' ? 'Recently Used' : 'X KOL'}
									</div>
									{addresses.map(item => {
										const flatIndex = filteredAddresses.flat.findIndex(f => f.path === item.path)
										const active = flatIndex === selectedIndex
										const chosen = value === item.address
										return (
											<button
												type="button"
												key={item.path}
												onMouseEnter={() => setSelectedIndex(flatIndex)}
												onClick={() => {
													onChange(item.address)
													setInputValue(item.address)
													setIsValidAddress(true)
													saveRecentAddress(item.address)
													setIsDropdownOpen(false)
												}}
												className={`w-full px-3 py-2 text-left flex flex-col gap-0.5 transition-colors ${active ? 'bg-purple-300/20' : 'hover:bg-white/5'} ${chosen ? 'ring-1 ring-purple-400/40' : ''}`}
											>
												<span className="text-white font-mono text-sm truncate">{item.address}</span>
												<span className="text-xs text-gray-400 truncate">
													{item.path.includes('recent') ? (
														'recent'
													) : item.path.includes('kol') ? (
														(() => {
															const handle = item.path.split('kol.')[1]
															return (
																<a href={`https://x.com/${handle}`} target="_blank" rel="noopener noreferrer" className="text-purple-300 hover:text-purple-500">
																	@{handle}
																</a>
															)
														})()
													) : (
														item.path
													)}
												</span>
											</button>
										)
									})}
								</div>
							))
						)}
					</div>
					{inputValue && isAddress(inputValue as `0x${string}`) && (
						<div className="border-t border-white/10 p-2">
							<button
								type="button"
								className="w-full px-3 py-2 text-left text-sm text-purple-200 hover:bg-white/5 rounded-lg"
								onClick={() => {
									onChange(inputValue.trim())
									saveRecentAddress(inputValue.trim())
									setIsValidAddress(true)
									setIsDropdownOpen(false)
								}}
							>
								Use typed address: <span className="font-mono">{inputValue.trim()}</span>
							</button>
						</div>
					)}
				</div>
			)}

			{/* Error Message area with fixed height to prevent layout shift */}
			<div className="mt-1 ml-3 h-4">
				{!isValidAddress && (
					<p className="text-red-400 text-xs leading-4">Please enter a valid Ethereum address</p>
				)}
			</div>
			<style jsx>{`
				@keyframes shake {
					10%, 90% { transform: translateX(-2px); }
					20%, 80% { transform: translateX(3px); }
					30%, 50%, 70% { transform: translateX(-4px); }
					40%, 60% { transform: translateX(4px); }
				}
				.shake {
					animation: shake 0.3s ease-in-out;
				}
			`}</style>
		</div>
	)
}
