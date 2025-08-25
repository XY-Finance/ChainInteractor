import React from 'react'
import { WalletSelector, WalletOperations } from '../../components/wallet'

export default function WalletDemoPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            🔗 Wallet Connection Hub
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Connect your wallet here to use it across all features. This modular wallet system supports
            environment private keys, injected wallets (MetaMask), and embedded wallets (Privy).
            Currently, only environment private key wallets are implemented.
          </p>
        </div>

        {/* Wallet Features */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-blue-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">
              🔑 Local Private Key
            </h3>
            <ul className="text-sm text-blue-800 space-y-2">
              <li>• Reads multiple private keys from .env file</li>
              <li>• Supports legacy format: PRIVATE_KEYS=&quot;0x111... 0x222...&quot;</li>
              <li>• Supports dynamic format: KEY0, KEY1, KEY2, etc.</li>
              <li>• Full EIP-7702 support</li>
              <li>• Smart account creation</li>
              <li>• Transaction signing and sending</li>
            </ul>
          </div>

          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              🌐 Injected Wallet (MetaMask)
            </h3>
            <ul className="text-sm text-gray-700 space-y-2">
              <li>• MetaMask integration</li>
              <li>• Browser wallet support</li>
              <li>• EIP-7702 with personal_sign</li>
              <li>• User-friendly interface</li>
              <li>• EIP-712 typed data signing</li>
            </ul>
          </div>

          <div className="bg-purple-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-purple-900 mb-3">
              🔒 Embedded Wallet (Coming Soon)
            </h3>
            <ul className="text-sm text-purple-800 space-y-2">
              <li>• Privy integration</li>
              <li>• Social login support</li>
              <li>• Gasless transactions</li>
              <li>• Enhanced UX</li>
            </ul>
          </div>

          <div className="bg-green-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-green-900 mb-3">
              ⚡ EIP-7702 Features
            </h3>
            <ul className="text-sm text-green-800 space-y-2">
              <li>• Authorization signing</li>
              <li>• Smart account creation</li>
              <li>• User operation sending</li>
              <li>• Cross-wallet compatibility</li>
            </ul>
          </div>
        </div>

        {/* Setup Instructions */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-yellow-900 mb-3">
            🚀 Quick Setup
          </h3>
          <div className="text-sm text-yellow-800 space-y-2">
            <p>To test the local private key wallet:</p>
            <ol className="list-decimal list-inside ml-4 space-y-1">
              <li>Create a <code className="bg-yellow-100 px-1 rounded">.env.local</code> file in the project root</li>
              <li>Add your test private keys using one of these formats:</li>
              <li className="ml-4">
                <strong>Legacy format:</strong> <code className="bg-yellow-100 px-1 rounded">PRIVATE_KEYS=&quot;0x111...111 0x222...222 0x333...333&quot;</code>
              </li>
              <li className="ml-4">
                <strong>New format:</strong> <code className="bg-yellow-100 px-1 rounded">KEY0=0x111...111</code>, <code className="bg-yellow-100 px-1 rounded">KEY1=0x222...222</code>, etc.
              </li>
              <li>Make sure you have some Sepolia test ETH</li>
              <li>Connect your wallet below and start testing!</li>
            </ol>
            <p className="mt-3 text-xs">
              <strong>⚠️ Security Note:</strong> Only use test private keys. Never use your main wallet&apos;s private key for development.
            </p>
          </div>
        </div>

        {/* Wallet Components */}
        <div className="grid lg:grid-cols-2 gap-8">
          <WalletSelector />
          <WalletOperations />
        </div>

        {/* Architecture Info */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            🏗️ Architecture Overview
          </h3>
          <div className="text-sm text-gray-700 space-y-3">
            <p>
              The modular wallet system is built with TypeScript and follows a clean architecture pattern:
            </p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li><strong>Types:</strong> <code className="bg-gray-100 px-1 rounded">src/types/wallet.ts</code> - TypeScript interfaces</li>
              <li><strong>Base Class:</strong> <code className="bg-gray-100 px-1 rounded">src/lib/wallets/base-wallet.ts</code> - Common functionality</li>
              <li><strong>Implementations:</strong> <code className="bg-gray-100 px-1 rounded">src/lib/wallets/local-key-wallet.ts</code> - Specific wallet types</li>
              <li><strong>Manager:</strong> <code className="bg-gray-100 px-1 rounded">src/lib/wallets/wallet-manager.ts</code> - Multi-wallet coordination</li>
              <li><strong>React Hook:</strong> <code className="bg-gray-100 px-1 rounded">src/hooks/useWalletManager.ts</code> - React integration</li>
              <li><strong>Components:</strong> <code className="bg-gray-100 px-1 rounded">src/components/wallet/</code> - UI components</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
