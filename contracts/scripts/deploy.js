const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with:", deployer.address);

  // Deploy NFT contract
  const NFT = await hre.ethers.getContractFactory("MarketplaceNFT");
  const nft = await NFT.deploy();
  await nft.waitForDeployment();
  console.log("MarketplaceNFT deployed to:", await nft.getAddress());

  // Deploy Marketplace with 2.5% fee
  const Marketplace = await hre.ethers.getContractFactory("NFTMarketplace");
  const marketplace = await Marketplace.deploy(250);
  await marketplace.waitForDeployment();
  console.log("NFTMarketplace deployed to:", await marketplace.getAddress());

  // Save addresses for frontend
  const addresses = {
    nftContract: await nft.getAddress(),
    marketplace: await marketplace.getAddress(),
    network: hre.network.name,
    chainId: (await hre.ethers.provider.getNetwork()).chainId.toString(),
  };

  const frontendDir = path.join(__dirname, "../../frontend/src/contracts");
  if (!fs.existsSync(frontendDir)) fs.mkdirSync(frontendDir, { recursive: true });

  fs.writeFileSync(
    path.join(frontendDir, "addresses.json"),
    JSON.stringify(addresses, null, 2)
  );

  // Copy ABIs
  const nftArtifact = await hre.artifacts.readArtifact("MarketplaceNFT");
  const marketplaceArtifact = await hre.artifacts.readArtifact("NFTMarketplace");

  fs.writeFileSync(path.join(frontendDir, "MarketplaceNFT.json"), JSON.stringify(nftArtifact.abi, null, 2));
  fs.writeFileSync(path.join(frontendDir, "NFTMarketplace.json"), JSON.stringify(marketplaceArtifact.abi, null, 2));

  console.log("Contract addresses and ABIs saved to frontend/src/contracts/");
}

main().catch((err) => { console.error(err); process.exit(1); });
