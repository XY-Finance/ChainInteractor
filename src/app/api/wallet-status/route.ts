import { NextResponse } from 'next/server'

export async function GET() {
  const hasPrivateKeys = !!process.env.PRIVATE_KEYS

  return NextResponse.json({
    localKeyAvailable: hasPrivateKeys,
    privateKeysCount: hasPrivateKeys ? process.env.PRIVATE_KEYS!.split(' ').length : 0
  })
}
