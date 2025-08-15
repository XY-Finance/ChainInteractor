import { NextResponse } from 'next/server'
import { privateKeyToAccount } from 'viem/accounts'

export async function GET() {
  const privateKeysEnv = process.env.PRIVATE_KEYS

  if (!privateKeysEnv) {
    return NextResponse.json({ keys: [] })
  }

  // Parse multiple private keys from PRIVATE_KEYS env var
  // Format: PRIVATE_KEYS="0x111...111 0x222...222 0x333...333"
  const privateKeyStrings = privateKeysEnv.split(/\s+/).filter(key => key.trim() !== '')

  if (privateKeyStrings.length === 0) {
    return NextResponse.json({ keys: [] })
  }

  const keys = privateKeyStrings.map((keyString, index) => {
    const privateKey = keyString.trim()

    if (!privateKey.startsWith('0x') || privateKey.length !== 66) {
      console.log(`⚠️ Invalid private key format at index ${index}: "${privateKey}". Skipping this key.`)
      return null
    }

    try {
      const account = privateKeyToAccount(privateKey as `0x${string}`)
      return {
        index,
        address: account.address
      }
    } catch (error) {
      console.error(`❌ Failed to process private key at index ${index}:`, error)
      return null
    }
  }).filter(key => key !== null)

  return NextResponse.json({ keys })
}
