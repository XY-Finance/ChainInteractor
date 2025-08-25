# Inputs
OWNER=0x51c289a2C7aE30BC39D60F0d210cC17FA15C8950
SPENDER=0x856c363e043Ac34B19D584D3930bfa615947994E
TOKEN=0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238   # USDC Sepolia

# Amount and expiry
VALUE=1000000                                      # 1e6 base units = 1 USDC
DEADLINE=2756099813 # $(( $(date -u +%s) + 36000 ))              # 1h from now

# Chain/domain data
NONCE=$(cast call $TOKEN 'nonces(address)(uint256)' $OWNER -r 11155111)
NAME=$(cast call  $TOKEN 'name()(string)' -r 11155111)          # typically "USD Coin"
VER=$(cast call   $TOKEN 'version()(string)' -r 11155111 || echo 2)
CID=$(cast chain-id -r 11155111)                                 # 11155111
echo "Nonce: $NONCE"
echo "Name: $NAME"
echo "Version: $VER"
echo "Chain ID: $CID"

# Build typed-data JSON
cat > permit.json <<EOF
{
  "types": {
    "EIP712Domain": [
      {"name":"name","type":"string"},
      {"name":"version","type":"string"},
      {"name":"chainId","type":"uint256"},
      {"name":"verifyingContract","type":"address"}
    ],
    "Permit": [
      {"name":"owner","type":"address"},
      {"name":"spender","type":"address"},
      {"name":"value","type":"uint256"},
      {"name":"nonce","type":"uint256"},
      {"name":"deadline","type":"uint256"}
    ]
  },
  "primaryType": "Permit",
  "domain": {
    "name": $NAME,
    "version": $VER,
    "chainId": $CID,
    "verifyingContract": "$TOKEN"
  },
  "message": {
    "owner": "$OWNER",
    "spender": "$SPENDER",
    "value": "$VALUE",
    "nonce": "$NONCE",
    "deadline": "$DEADLINE"
  }
}
EOF

# Sign (EIP-712 hashing handled by cast)
SIG=$(cast wallet sign --data --from-file permit.json --private-key $KEY2)
echo "SIG=$SIG"

# Optional: split for permit()
# R=0x${SIG:2:64}; S=0x${SIG:66:64}; V=$((16#${SIG:130:2}))
# echo "V=$V"; echo "R=$R"; echo "S=$S"

# Sign in another way
DOMAIN_SEPARATOR=$(cast call $TOKEN 'DOMAIN_SEPARATOR()(bytes32)' -r 11155111)
PERMIT_TYPEHASH=$(cast call $TOKEN 'PERMIT_TYPEHASH()(bytes32)' -r 11155111)
echo "DOMAIN_SEPARATOR=$DOMAIN_SEPARATOR"
echo "PERMIT_TYPEHASH=$PERMIT_TYPEHASH"

structHash=$(cast keccak $(cast abi-encode "Permit(bytes32,address,address,uint256,uint256,uint256)" $PERMIT_TYPEHASH $OWNER $SPENDER $VALUE $NONCE $DEADLINE))
echo "structHash=$structHash"

digest=$(cast keccak $(cast concat-hex 0x1901 $DOMAIN_SEPARATOR $structHash))
echo "digest=$digest"

SIG=$(cast wallet sign --no-hash --private-key $KEY2 $digest)
echo "SIG=$SIG"