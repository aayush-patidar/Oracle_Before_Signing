const hre = require("hardhat");
import * as fs from "fs";
import * as path from "path";

async function main() {
    console.log("🚀 Deploying OBS contracts to Monad Testnet...\n");

    // Get network info
    const network = await hre.ethers.provider.getNetwork();
    console.log("📡 Network:", network.name);
    console.log("🔗 Chain ID:", network.chainId.toString());

    // Get deployer
    const signers = await hre.ethers.getSigners();
    if (signers.length === 0) {
        console.error("❌ Error: No signers available!");
        console.error("Please check your DEPLOYER_PRIVATE_KEY in .env file.");
        process.exit(1);
    }

    const deployer = signers[0];
    const deployerAddress = await deployer.getAddress();
    console.log("👤 Deployer address:", deployerAddress);

    const balance = await hre.ethers.provider.getBalance(deployerAddress);
    console.log("💰 Deployer balance:", hre.ethers.formatEther(balance), "MON\n");

    if (balance === 0n) {
        console.error("❌ Error: Deployer has no MON tokens!");
        console.error("Please get testnet MON tokens from the faucet first.");
        process.exit(1);
    }

    // Deploy MockUSDT
    console.log("📝 Deploying MockUSDT...");
    const MockUSDT = await hre.ethers.getContractFactory("MockUSDT");
    const mockUSDT = await MockUSDT.deploy();
    await mockUSDT.waitForDeployment();
    const usdtAddress = await mockUSDT.getAddress();
    console.log("✅ MockUSDT deployed to:", usdtAddress);

    // Deploy MaliciousSpender
    console.log("\n📝 Deploying MaliciousSpender...");
    const MaliciousSpender = await hre.ethers.getContractFactory("MaliciousSpender");
    const maliciousSpender = await MaliciousSpender.deploy();
    await maliciousSpender.waitForDeployment();
    const spenderAddress = await maliciousSpender.getAddress();
    console.log("✅ MaliciousSpender deployed to:", spenderAddress);

    // Mint initial tokens to deployer (for testing)
    const INITIAL_MINT = 1000 * 10 ** 6; // 1000 USDT
    console.log("\n💸 Minting", INITIAL_MINT / 10 ** 6, "USDT to deployer...");
    const mintTx = await mockUSDT.mint(deployerAddress, INITIAL_MINT);
    await mintTx.wait();
    console.log("✅ Tokens minted successfully");

    // Create chain state file
    const chainState = {
        network: {
            name: "Monad Testnet",
            chainId: Number(network.chainId),
            rpcUrl: process.env.MONAD_RPC_URL || "https://testnet-rpc.monad.xyz/",
            explorer: "http://testnet.monadexplorer.com/"
        },
        contracts: {
            mockUSDT: {
                address: usdtAddress,
                symbol: "USDT",
                decimals: 6,
                explorerUrl: `http://testnet.monadexplorer.com/address/${usdtAddress}`
            },
            maliciousSpender: {
                address: spenderAddress,
                explorerUrl: `http://testnet.monadexplorer.com/address/${spenderAddress}`
            }
        },
        deployer: {
            address: deployerAddress,
            initialBalance: hre.ethers.formatEther(balance)
        },
        deploymentTime: new Date().toISOString()
    };

    // Write to chain/state.json
    const statePath = path.join(process.cwd(), "state.json");
    fs.writeFileSync(statePath, JSON.stringify(chainState, null, 2), "utf-8");
    console.log("\n📄 Chain state written to:", statePath);

    // Print summary
    console.log("\n" + "=".repeat(60));
    console.log("🎉 DEPLOYMENT SUCCESSFUL!");
    console.log("=".repeat(60));
    console.log("\n📋 Contract Addresses:");
    console.log("   MockUSDT:", usdtAddress);
    console.log("   MaliciousSpender:", spenderAddress);
    console.log("\n🔍 View on Explorer:");
    console.log("   MockUSDT:", `http://testnet.monadexplorer.com/address/${usdtAddress}`);
    console.log("   MaliciousSpender:", `http://testnet.monadexplorer.com/address/${spenderAddress}`);
    console.log("\n💡 Next Steps:");
    console.log("   1. Update your .env file with these contract addresses");
    console.log("   2. Configure MetaMask to connect to Monad Testnet");
    console.log("   3. Start your application: npm run dev");
    console.log("=".repeat(60) + "\n");
}

main().catch((error) => {
    console.error("\n❌ Deployment failed:");
    console.error(error);
    process.exitCode = 1;
});
