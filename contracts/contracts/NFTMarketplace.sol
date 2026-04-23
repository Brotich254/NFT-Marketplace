// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title NFTMarketplace
 * @dev Allows users to list, buy, and cancel NFT listings.
 *      Charges a configurable marketplace fee on each sale.
 */
contract NFTMarketplace is ReentrancyGuard, Ownable {
    uint256 public constant FEE_DENOMINATOR = 10000;
    uint256 public feePercent; // e.g. 250 = 2.5%
    uint256 private _listingIdCounter;

    struct Listing {
        uint256 listingId;
        address nftContract;
        uint256 tokenId;
        address payable seller;
        uint256 price;
        bool active;
    }

    // listingId => Listing
    mapping(uint256 => Listing) public listings;

    // nftContract => tokenId => listingId (0 = not listed)
    mapping(address => mapping(uint256 => uint256)) public tokenListingId;

    event Listed(
        uint256 indexed listingId,
        address indexed nftContract,
        uint256 indexed tokenId,
        address seller,
        uint256 price
    );

    event Sold(
        uint256 indexed listingId,
        address indexed nftContract,
        uint256 indexed tokenId,
        address seller,
        address buyer,
        uint256 price
    );

    event Cancelled(uint256 indexed listingId);

    constructor(uint256 _feePercent) Ownable(msg.sender) {
        feePercent = _feePercent;
    }

    /**
     * @dev List an NFT for sale. Seller must approve this contract first.
     */
    function listNFT(
        address nftContract,
        uint256 tokenId,
        uint256 price
    ) external nonReentrant {
        require(price > 0, "Price must be > 0");
        IERC721 nft = IERC721(nftContract);
        require(nft.ownerOf(tokenId) == msg.sender, "Not the owner");
        require(
            nft.isApprovedForAll(msg.sender, address(this)) ||
            nft.getApproved(tokenId) == address(this),
            "Marketplace not approved"
        );

        uint256 listingId = ++_listingIdCounter;
        listings[listingId] = Listing({
            listingId: listingId,
            nftContract: nftContract,
            tokenId: tokenId,
            seller: payable(msg.sender),
            price: price,
            active: true
        });
        tokenListingId[nftContract][tokenId] = listingId;

        emit Listed(listingId, nftContract, tokenId, msg.sender, price);
    }

    /**
     * @dev Buy a listed NFT. Sends fee to owner, remainder to seller.
     */
    function buyNFT(uint256 listingId) external payable nonReentrant {
        Listing storage listing = listings[listingId];
        require(listing.active, "Listing not active");
        require(msg.value >= listing.price, "Insufficient ETH");
        require(msg.sender != listing.seller, "Cannot buy own listing");

        listing.active = false;
        tokenListingId[listing.nftContract][listing.tokenId] = 0;

        uint256 fee = (listing.price * feePercent) / FEE_DENOMINATOR;
        uint256 sellerProceeds = listing.price - fee;

        // Transfer NFT to buyer
        IERC721(listing.nftContract).safeTransferFrom(
            listing.seller,
            msg.sender,
            listing.tokenId
        );

        // Pay seller
        listing.seller.transfer(sellerProceeds);

        // Pay marketplace fee
        if (fee > 0) {
            payable(owner()).transfer(fee);
        }

        // Refund excess ETH
        if (msg.value > listing.price) {
            payable(msg.sender).transfer(msg.value - listing.price);
        }

        emit Sold(listingId, listing.nftContract, listing.tokenId, listing.seller, msg.sender, listing.price);
    }

    /**
     * @dev Cancel a listing. Only the seller can cancel.
     */
    function cancelListing(uint256 listingId) external nonReentrant {
        Listing storage listing = listings[listingId];
        require(listing.active, "Not active");
        require(listing.seller == msg.sender || owner() == msg.sender, "Not authorized");

        listing.active = false;
        tokenListingId[listing.nftContract][listing.tokenId] = 0;

        emit Cancelled(listingId);
    }

    /**
     * @dev Get all active listings (paginated).
     */
    function getActiveListings(uint256 offset, uint256 limit)
        external
        view
        returns (Listing[] memory result, uint256 total)
    {
        uint256 count = 0;
        for (uint256 i = 1; i <= _listingIdCounter; i++) {
            if (listings[i].active) count++;
        }
        total = count;

        uint256 end = offset + limit > count ? count : offset + limit;
        result = new Listing[](end > offset ? end - offset : 0);
        uint256 idx = 0;
        uint256 seen = 0;
        for (uint256 i = 1; i <= _listingIdCounter && idx < result.length; i++) {
            if (listings[i].active) {
                if (seen >= offset) {
                    result[idx++] = listings[i];
                }
                seen++;
            }
        }
    }

    function setFeePercent(uint256 _feePercent) external onlyOwner {
        require(_feePercent <= 1000, "Max 10%");
        feePercent = _feePercent;
    }

    function totalListings() external view returns (uint256) {
        return _listingIdCounter;
    }

    receive() external payable {}
}
