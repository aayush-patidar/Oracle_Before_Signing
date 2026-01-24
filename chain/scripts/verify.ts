const hre = require("hardhat");

async function main() {
  console.log("Verifying contract behavior...");

  // Use the same addresses as the deploy script
  const USER_WALLET = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";
  const INITIAL_MINT = 1000 * 10 ** 6;

  console.log("Deploying fresh contracts for verification...");

  // Deploy MockUSDT
  const MockUSDT = await hre.ethers.getContractFactory("MockUSDT");
  const mockUSDT = await MockUSDT.deploy();
  await mockUSDT.waitForDeployment();
  const usdtAddress = await mockUSDT.getAddress();
  console.log("MockUSDT deployed to:", usdtAddress);

  // Mint initial tokens to user wallet
  const mintTx = await mockUSDT.mint(USER_WALLET, INITIAL_MINT);
  await mintTx.wait();
  console.log(`Minted ${INITIAL_MINT / 10 ** 6} USDT to ${USER_WALLET}`);

  // Check balance
  const balance = await mockUSDT.balanceOf(USER_WALLET);
  console.log("User USDT Balance:", balance.toString());

  // Verify it's 1000000000 (1000 * 10^6)
  const expectedBalance = 1000 * 10 ** 6;
  if (balance.toString() === expectedBalance.toString()) {
    console.log("✅ Balance verification successful!");
  } else {
    console.log("❌ Balance verification failed!");
    console.log("Expected:", expectedBalance.toString());
    console.log("Got:", balance.toString());
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});