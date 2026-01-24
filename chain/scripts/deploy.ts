const hre = require("hardhat");
import * as fs from "fs";
import * as path from "path";

// NOTE: These are the default Hardhat sample accounts addresses.
// This script assumes you're running on the local hardhat network.
const USER_WALLET = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";
const MALICIOUS_SPENDER = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

// 1000 USDT with 6 decimals
const INITIAL_MINT = 1000 * 10 ** 6;

async function main() {
  console.log("Deploying OBS contracts...");

  // Optional: log deployer to ensure signer works
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deployer:", deployer.address);

  // Deploy MockUSDT
  const MockUSDT = await hre.ethers.getContractFactory("MockUSDT");
  const mockUSDT = await MockUSDT.deploy();
  await mockUSDT.waitForDeployment();
  const usdtAddress = await mockUSDT.getAddress();
  console.log("MockUSDT deployed to:", usdtAddress);

  // Deploy MaliciousSpender
  const MaliciousSpender = await hre.ethers.getContractFactory("MaliciousSpender");
  const maliciousSpender = await MaliciousSpender.deploy();
  await maliciousSpender.waitForDeployment();
  const spenderAddress = await maliciousSpender.getAddress();
  console.log("MaliciousSpender deployed to:", spenderAddress);

  // Mint initial tokens to user wallet
  const mintTx = await mockUSDT.mint(USER_WALLET, INITIAL_MINT);
  await mintTx.wait();
  console.log(`Minted ${INITIAL_MINT / 10 ** 6} USDT to ${USER_WALLET}`);

  // Create chain state file
  const chainState = {
    contracts: {
      mockUSDT: {
        address: usdtAddress,
        symbol: "USDT",
        decimals: 6
      },
      maliciousSpender: {
        address: spenderAddress
      }
    },
    wallets: {
      user: USER_WALLET,
      maliciousSpender: MALICIOUS_SPENDER
    },
    initialState: {
      userBalance: INITIAL_MINT.toString()
    }
  };

  // Write to chain/state.json
  // Using process.cwd() keeps it stable no matter how TS runs the script
  const statePath = path.join(process.cwd(), "state.json");
  fs.writeFileSync(statePath, JSON.stringify(chainState, null, 2), "utf-8");
  console.log("Chain state written to:", statePath);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
