'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import GlobalWalletManager from './GlobalWalletManager'

export default function Navigation() {
  const pathname = usePathname()

  return (
    <nav className="sticky top-0 z-50 bg-white shadow-sm border-b">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/wallet-actions" className="text-xl font-bold text-gray-900">
                ‍️✨✨  Super Smart Wallet ✨✨
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link
                href="/wallet-actions"
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  pathname === '/wallet-actions'
                    ? 'border-orange-500 text-gray-900'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                Wallet Actions
              </Link>
              <Link
                href="/zerodev"
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  pathname === '/zerodev'
                    ? 'border-blue-500 text-gray-900'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                ZeroDev Demo
              </Link>
              <Link
                href="/hyperintent"
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  pathname === '/hyperintent'
                    ? 'border-blue-500 text-gray-900'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                HyperIntent
              </Link>
            </div>
          </div>

          {/* Global Wallet Manager */}
          <div className="flex items-center">
            <GlobalWalletManager />
          </div>
        </div>
      </div>
    </nav>
  )
}
