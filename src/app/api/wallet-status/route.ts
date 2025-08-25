import { NextResponse } from 'next/server'

export async function GET() {
  // Only use PRIVATE_KEYS format
  const privateKeys = process.env.PRIVATE_KEYS

  // Debug logging
  console.log('🔍 Environment variables found:')
  console.log('PRIVATE_KEYS:', privateKeys ? 'Found' : 'Not found')
  if (privateKeys) {
    const keyCount = privateKeys.split(/\s+/).filter(key => key.trim() !== '').length
    console.log('Number of keys in PRIVATE_KEYS:', keyCount)
  }

  const hasPrivateKeys = !!privateKeys
  const privateKeysCount = hasPrivateKeys ? privateKeys.split(/\s+/).filter(key => key.trim() !== '').length : 0

  return NextResponse.json({
    localKeyAvailable: hasPrivateKeys,
    privateKeysCount,
    format: 'legacy'
  })
}
