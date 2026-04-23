const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("NFTMarketplace", function () {
  let nft, marketplace, owner, seller, buyer;

  beforeEach(async () => {
    [owner, seller, buyer] = await ethers.getSigners();

    const NFT = await ethers.getContractFactory("MarketplaceNFT");
    nft = await NFT.deploy();

    const Marketplace = await ethers.getContractFactory("NFTMarketplace");
    marketplace = await Marketplace.deploy(250); // 2.5%
  });

  it("should mint an NFT", async () => {
    await nft.connect(seller).mint(seller.address, "ipfs://test-uri");
    expect(await nft.ownerOf(0)).to.equal(seller.address);
  });

  it("should list an NFT", async () => {
    await nft.connect(seller).mint(seller.address, "ipfs://test-uri");
    await nft.connect(seller).setApprovalForAll(await marketplace.getAddress(), true);

    const price = ethers.parseEther("1.0");
    await marketplace.connect(seller).listNFT(await nft.getAddress(), 0, price);

    const listing = await marketplace.listings(1);
    expect(listing.active).to.be.true;
    expect(listing.price).to.equal(price);
  });

  it("should buy an NFT and transfer ownership", async () => {
    await nft.connect(seller).mint(seller.address, "ipfs://test-uri");
    await nft.connect(seller).setApprovalForAll(await marketplace.getAddress(), true);

    const price = ethers.parseEther("1.0");
    await marketplace.connect(seller).listNFT(await nft.getAddress(), 0, price);

    const sellerBefore = await ethers.provider.getBalance(seller.address);
    await marketplace.connect(buyer).buyNFT(1, { value: price });

    expect(await nft.ownerOf(0)).to.equal(buyer.address);
    const listing = await marketplace.listings(1);
    expect(listing.active).to.be.false;
  });

  it("should cancel a listing", async () => {
    await nft.connect(seller).mint(seller.address, "ipfs://test-uri");
    await nft.connect(seller).setApprovalForAll(await marketplace.getAddress(), true);
    await marketplace.connect(seller).listNFT(await nft.getAddress(), 0, ethers.parseEther("1.0"));
    await marketplace.connect(seller).cancelListing(1);

    const listing = await marketplace.listings(1);
    expect(listing.active).to.be.false;
  });

  it("should not allow buying own listing", async () => {
    await nft.connect(seller).mint(seller.address, "ipfs://test-uri");
    await nft.connect(seller).setApprovalForAll(await marketplace.getAddress(), true);
    await marketplace.connect(seller).listNFT(await nft.getAddress(), 0, ethers.parseEther("1.0"));

    await expect(
      marketplace.connect(seller).buyNFT(1, { value: ethers.parseEther("1.0") })
    ).to.be.revertedWith("Cannot buy own listing");
  });
});
