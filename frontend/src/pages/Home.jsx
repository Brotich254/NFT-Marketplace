import { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { useWalletContext } from '../context/WalletContext';
import NFTCard from '../components/NFTCard';
import { fetchMetadata } from '../utils/ipfs';

export default function Home() {
  const { marketplace, nftContract, account, connect } = useWalletContext();
  const [listings, setListings] = useState([]);
  const [metadataMap, setMetadataMap] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!marketplace || !nftContract) return;
    loadListings();
  }, [marketplace, nftContract]);

  const loadListings = async () => {
    setLoading(true);
    try {
      const [result] = await marketplace.getActiveListings(0, 50);
      setListings(result);

      // Fetch metadata for each NFT
      const map = {};
      await Promise.all(result.map(async (listing) => {
        try {
          const uri = await nftContract.tokenURI(listing.tokenId);
          const meta = await fetchMetadata(uri);
          map[listing.listingId.toString()] = meta;
        } catch {}
      }));
      setMetadataMap(map);
    } catch (err) {
      console.error('Failed to load listings:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">NFT Marketplace</h1>
        <p className="text-gray-400 mt-1">Discover, collect, and sell digital art on-chain.</p>
      </div>

      {!account && (
        <div className="bg-violet-900/30 border border-violet-700 rounded-2xl p-6 text-center mb-8">
          <p className="text-violet-300 mb-3">Connect your wallet to buy, sell, and mint NFTs</p>
          <button onClick={connect} className="bg-violet-600 hover:bg-violet-700 text-white px-6 py-2.5 rounded-xl font-semibold transition">
            Connect MetaMask
          </button>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-gray-900 rounded-2xl aspect-square animate-pulse" />
          ))}
        </div>
      ) : listings.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <p className="text-4xl mb-3">🖼</p>
          <p>No listings yet. Be the first to mint and list an NFT.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
          {listings.map((listing) => (
            <NFTCard
              key={listing.listingId.toString()}
              listing={listing}
              metadata={metadataMap[listing.listingId.toString()]}
            />
          ))}
        </div>
      )}
    </div>
  );
}
