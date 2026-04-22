# NFTVault — NFT Marketplace

Solidity + Hardhat + React + ethers.js on Ethereum (local or Sepolia testnet).

## Stack
- Smart Contracts: Solidity 0.8.20, OpenZeppelin ERC721, Hardhat
- Frontend: React, Vite, Tailwind, ethers.js v6
- Wallet: MetaMask

## Smart Contracts
- `MarketplaceNFT.sol` — ERC721 NFT contract with mint function
- `NFTMarketplace.sol` — Marketplace with list, buy, cancel + 2.5% fee

## Setup

### 1. Contracts (local development)
```bash
cd contracts
npm install
npx hardhat node          # Start local blockchain (keep running)
npx hardhat run scripts/deploy.js --network localhost
# This deploys contracts and saves addresses + ABIs to frontend/src/contracts/
```

### 2. Frontend
```bash
cd frontend
npm install
npm run dev
```

### 3. MetaMask Setup (local)
- Add network: RPC URL `http://127.0.0.1:8545`, Chain ID `31337`
- Import a test account using one of the private keys printed by `hardhat node`

## Deploy to Sepolia Testnet
```bash
cd contracts
cp .env.example .env   # Add SEPOLIA_RPC_URL and PRIVATE_KEY
npx hardhat run scripts/deploy.js --network sepolia
```
Get Sepolia ETH from: https://sepoliafaucet.com

## Features
- Mint NFTs with name, description, image URL
- Optionally list immediately on mint
- Browse marketplace listings
- Buy NFTs with ETH (2.5% marketplace fee)
- Cancel your own listings
- View owned NFTs and list them
- MetaMask wallet connect/disconnect
# NFT-Marketplace
