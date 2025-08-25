import { NextResponse } from 'next/server'
import { privateKeyToAccount } from 'viem/accounts'

export async function GET() {
  const keys = await getAllPrivateKeys()

  // Debug logging
  console.log('🔍 Generated addresses:', keys.map(k => `${k.index}: ${k.address}`))

  return NextResponse.json({ keys })
}

async function getAllPrivateKeys(): Promise<Array<{ index: number; address: string }>> {
  const allKeys: Array<{ index: number; address: string }> = []
  let currentIndex = 0

  // Only use PRIVATE_KEYS format
  const privateKeys = process.env.PRIVATE_KEYS
  if (!privateKeys) {
    console.log('❌ No PRIVATE_KEYS environment variable found')
    return allKeys
  }

  console.log('🔍 Using PRIVATE_KEYS format')
  const privateKeyStrings = privateKeys.split(/\s+/).filter(key => key.trim() !== '')

  for (const keyString of privateKeyStrings) {
    const privateKey = keyString.trim()

    if (!privateKey.startsWith('0x') || privateKey.length !== 66) {
      console.log(`⚠️ Invalid private key format at index ${currentIndex}: "${privateKey}". Skipping this key.`)
      currentIndex++
      continue
    }

    try {
      const account = privateKeyToAccount(privateKey as `0x${string}`)
      allKeys.push({
        index: currentIndex,
        address: account.address
      })
      console.log(`✅ Processed key ${currentIndex}: ${account.address}`)
    } catch (error) {
      console.error(`❌ Failed to process private key at index ${currentIndex}:`, error)
    }
    currentIndex++
  }

  return allKeys
}
