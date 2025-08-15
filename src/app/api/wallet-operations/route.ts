import { NextResponse } from 'next/server'
import { privateKeyToAccount } from 'viem/accounts'
import { createWalletClient, http } from 'viem'
import { sepolia } from 'viem/chains'

export async function POST(request: Request) {
  try {
    const { operation, keyIndex, message, transaction } = await request.json()

    const privateKeysEnv = process.env.PRIVATE_KEYS
    if (!privateKeysEnv) {
      return NextResponse.json({ error: 'No private keys configured' }, { status: 400 })
    }

    const privateKeyStrings = privateKeysEnv.split(/\s+/).filter(key => key.trim() !== '')

    if (keyIndex < 0 || keyIndex >= privateKeyStrings.length) {
      return NextResponse.json({ error: 'Invalid key index' }, { status: 400 })
    }

    const privateKey = privateKeyStrings[keyIndex].trim()
    if (!privateKey.startsWith('0x') || privateKey.length !== 66) {
      return NextResponse.json({ error: 'Invalid private key format' }, { status: 400 })
    }

    const account = privateKeyToAccount(privateKey as `0x${string}`)
    const walletClient = createWalletClient({
      account,
      chain: sepolia,
      transport: http()
    })

    switch (operation) {
      case 'signMessage':
        if (!message) {
          return NextResponse.json({ error: 'Message required' }, { status: 400 })
        }
        const signature = await walletClient.request({
          method: 'personal_sign',
          params: [account.address, `0x${Buffer.from(message, 'utf8').toString('hex')}`]
        })
        return NextResponse.json({ signature })

      case 'sendTransaction':
        if (!transaction) {
          return NextResponse.json({ error: 'Transaction required' }, { status: 400 })
        }
        const hash = await walletClient.sendTransaction({
          ...transaction,
          account: account.address,
          chain: sepolia
        })
        return NextResponse.json({ hash })

      default:
        return NextResponse.json({ error: 'Unknown operation' }, { status: 400 })
    }
  } catch (error) {
    console.error('Wallet operation error:', error)
    return NextResponse.json({ error: 'Operation failed' }, { status: 500 })
  }
}
