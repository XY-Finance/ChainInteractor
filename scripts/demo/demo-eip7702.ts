import "dotenv/config";
import {
  createPublicClient,
  createWalletClient,
  http,
  zeroAddress,
  parseEther,
  type Hex,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { sepolia } from "viem/chains";
import { createBundlerClient } from "viem/account-abstraction";
import {
  Implementation,
  toMetaMaskSmartAccount,
  getDeleGatorEnvironment,
} from "@metamask/delegation-toolkit";

// Configuration
const chain = sepolia;

const publicClient = createPublicClient({
  transport: http(),
  chain,
});

const main = async () => {
  console.log("🚀 Starting MetaMask EIP-7702 Demo...");

  if (!process.env.PRIVATE_KEY) {
    throw new Error("PRIVATE_KEY environment variable is required. Please set it in your .env file or environment.");
  }

  const eoaAccount = privateKeyToAccount(process.env.PRIVATE_KEY as Hex);
  console.log("🔑 EOA Address:", eoaAccount.address);

  const walletClient = createWalletClient({
    account: eoaAccount,
    chain,
    transport: http(),
  });

  console.log("🏗️ Getting deleGator environment...");
  const environment = getDeleGatorEnvironment(sepolia.id);
  const contractAddress = environment.implementations.EIP7702StatelessDeleGatorImpl;
  console.log("📋 MetaMask deleGator Core address:", contractAddress);

  console.log("🔐 Authorizing EIP-7702 delegation...");
  const authorization = await walletClient.signAuthorization({
    account: eoaAccount.address,
    contractAddress,
    executor: "self",
  });
  console.log("✅ Authorization signed:", authorization);

  console.log("📤 Submitting authorization transaction...");
  const hash = await walletClient.sendTransaction({
    authorizationList: [authorization],
    data: "0x",
    to: zeroAddress,
  });
  console.log("✅ Transaction submitted:", hash);

  console.log("⏳ Waiting for transaction confirmation...");
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  console.log("🎉 Transaction confirmed!");

  console.log("🏗️ Creating MetaMask Smart Account...");
  const smartAccount = await toMetaMaskSmartAccount({
    client: publicClient,
    implementation: Implementation.Stateless7702,
    address: eoaAccount.address,
    signatory: { walletClient },
  });
  console.log("✅ Smart Account created:", smartAccount.address);

  console.log("📤 Setting up bundler client...");
  const bundlerClient = createBundlerClient({
    client: publicClient,
    transport: http("https://bundler.sepolia.zerodev.app"),
  });

  console.log("📤 Sending user operation...");
  const userOperationHash = await bundlerClient.sendUserOperation({
    account: smartAccount,
    calls: [
      {
        to: zeroAddress,
        value: parseEther("0"),
      }
    ],
    maxFeePerGas: BigInt(1),
    maxPriorityFeePerGas: BigInt(1),
  });
  console.log("✅ User operation sent:", userOperationHash);

  console.log("\n✨ MetaMask EIP-7702 Demo completed successfully!");
  console.log("🔗 Transaction URL:", `${chain.blockExplorers.default.url}/tx/${receipt.transactionHash}`);
  console.log("📊 Transaction Hash:", receipt.transactionHash);
  console.log("🚀 User Operation Hash:", userOperationHash);

  process.exit(0);
};

main().catch((error) => {
  console.error("❌ Error running MetaMask EIP-7702 demo:", error);
  process.exit(1);
});
