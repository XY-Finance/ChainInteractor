import { NextResponse } from 'next/server'
import { privateKeyToAccount } from 'viem/accounts'
import { createWalletClient, http} from 'viem'
import { sepolia } from 'viem/chains'
import { recoverAuthorizationAddress, verifyAuthorization } from 'viem/utils'
import { getDeleGatorEnvironment } from '@metamask/delegation-toolkit'

export async function POST(request: Request) {
  try {
    const { operation, keyIndex, message, transaction } = await request.json()

    const privateKey = await getPrivateKeyByIndex(keyIndex)
    if (!privateKey) {
      return NextResponse.json({ error: 'Invalid key index or no private keys configured' }, { status: 400 })
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
        // Use viem's signMessage function directly with the private key
        const signature = await walletClient.signMessage({
          message: message
        })
        return NextResponse.json({ signature })

      case 'signTypedData':
        if (!message || !message.domain || !message.types || !message.primaryType) {
          return NextResponse.json({ error: 'Typed data required with domain, types, and primaryType' }, { status: 400 })
        }
        // Use viem's signTypedData function directly with the private key
        const typedDataSignature = await walletClient.signTypedData({
          domain: message.domain,
          types: message.types,
          primaryType: message.primaryType,
          message: message.message
        })
        return NextResponse.json({ signature: typedDataSignature })

      case 'sign7702Authorization':
        if (!message) {
          return NextResponse.json({ error: 'Authorization data required' }, { status: 400 })
        }

        try {
          // Parse the authorization data
          const authData = JSON.parse(message)

          // Use the authorization data from the input
          const contractAddress = authData.contractAddress
          const executor = authData.executor

          const authorization = await walletClient.signAuthorization({
            account,
            contractAddress,
            executor,
          })

          console.log('🔐 EIP-7702 Authorization created:', authorization)

          // Recover the authorization address and verify it matches the signer
          let verificationResult = null
          try {
            const recoveredAddress = await recoverAuthorizationAddress({ authorization })
            const addressMatches = recoveredAddress.toLowerCase() === account.address.toLowerCase()

            verificationResult = {
              signerAddress: account.address,
              recoveredAddress: recoveredAddress,
              addressesMatch: addressMatches,
              isValid: addressMatches
            }

            console.log('🔍 Authorization verification:', verificationResult)
          } catch (recoveryError) {
            console.error('❌ Error recovering authorization address:', recoveryError)
            verificationResult = {
              signerAddress: account.address,
              recoveredAddress: null,
              addressesMatch: false,
              isValid: false,
              error: recoveryError instanceof Error ? recoveryError.message : 'Unknown error'
            }
          }

          // Convert BigInt values to strings for JSON serialization
          const serializableAuthorization = {
            ...authorization,
            ...(authorization.v !== undefined && { v: authorization.v.toString() }),
          }

          return NextResponse.json({
            authorization: serializableAuthorization,
            verification: verificationResult
          })
        } catch (error) {
          console.error('EIP-7702 authorization error:', error)
          return NextResponse.json({ error: 'Failed to create EIP-7702 authorization' }, { status: 500 })
        }

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

      case 'submit7702Authorization':
        if (!message) {
          return NextResponse.json({ error: 'Authorization required' }, { status: 400 })
        }

        try {
          // Parse the authorization from JSON string
          const authorization = message

          authorization.v = BigInt(authorization.v)

          console.log('📤 Authorization for viem:', authorization)

          // Verify the authorization before sending the transaction
          try {
            const isValid = await verifyAuthorization({
              address: account.address,
              authorization,
            })

            console.log('🔍 Authorization verification before submission:')
            console.log('   - Signer address:', account.address)
            console.log('   - Authorization valid:', isValid ? '✅ YES' : '❌ NO')

            if (!isValid) {
              console.error('❌ Authorization verification failed! Transaction will not be sent.')
              return NextResponse.json({
                error: 'Authorization verification failed - signature is invalid'
              }, { status: 400 })
            }

            console.log('✅ Authorization verified successfully, proceeding with transaction...')
          } catch (verificationError) {
            console.error('❌ Error during authorization verification:', verificationError)
            return NextResponse.json({
              error: 'Failed to verify authorization signature'
            }, { status: 400 })
          }

          // Following the exact code from MetaMask Delegation Toolkit docs:
          const hash = await walletClient.sendTransaction({
            authorizationList: [authorization],
            data: "0x",
            to: account.address,
          })

          console.log('📤 Transaction hash:', hash)

          return NextResponse.json({ hash })
        } catch (error) {
          console.error('EIP-7702 submission error:', error)
          return NextResponse.json({ error: 'Failed to submit EIP-7702 authorization' }, { status: 500 })
        }

      default:
        return NextResponse.json({ error: 'Unknown operation' }, { status: 400 })
    }
  } catch (error) {
    console.error('Wallet operation error:', error)
    return NextResponse.json({ error: 'Operation failed' }, { status: 500 })
  }
}

async function getPrivateKeyByIndex(keyIndex: number): Promise<string | null> {
  // First, try to get all private keys in order
  const allPrivateKeys = await getAllPrivateKeys()

  if (keyIndex < 0 || keyIndex >= allPrivateKeys.length) {
    return null
  }

  return allPrivateKeys[keyIndex]
}

async function getAllPrivateKeys(): Promise<string[]> {
  const allKeys: string[] = []

  // Only use PRIVATE_KEYS format
  const privateKeys = process.env.PRIVATE_KEYS
  if (!privateKeys) {
    return allKeys
  }

  const privateKeyStrings = privateKeys.split(/\s+/).filter(key => key.trim() !== '')
  for (const keyString of privateKeyStrings) {
    const privateKey = keyString.trim()
    if (privateKey.startsWith('0x') && privateKey.length === 66) {
      allKeys.push(privateKey)
    }
  }

  return allKeys
}
