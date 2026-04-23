import { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { useWalletContext } from '../context/WalletContext';
import { fetchMetadata } from '../utils/ipfs';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function MyNFTs() {
  const { account, nftContract, marketplace, addresses, connect } = useWalletContext();
  const [nfts, setNfts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [listingForm, setListingForm] = useState({});
  const [listing, setListing] = useState(null);

  useEffect(() => {
    if (!account || !nftContract) return;
    loadMyNFTs();
  }, [account, nftContract]);

  const loadMyNFTs = async () => {
    setLoading(true);
    try {
      const total = await nftContract.totalSupply();
      const owned = [];
      for (let i = 0; i < Number(total); i++) {
        try {
          const owner = await nftContract.ownerOf(i);
          if (owner.toLowerCase() === account.toLowerCase()) {
            const uri = await nftContract.tokenURI(i);
            const meta = await fetchMetadata(uri);
            const listingId = await marketplace.tokenListingId(addresses.nftContract, i);
            owned.push({ tokenId: i, metadata: meta, listingId: Number(listingId) });
          }
        } catch {}
      }
      setNfts(owned);
    } finally {
      setLoading(false);
    }
  };

  const handleList = async (tokenId) => {
    const price = listingForm[tokenId];
    if (!price) return;
    try {
      toast.loading('Approving...', { id: 'list' });
      const approveTx = await nftContract.setApprovalForAll(addresses.marketplace, true);
      await approveTx.wait();

      toast.loading('Listing...', { id: 'list' });
      const tx = await marketplace.listNFT(addresses.nftContract, tokenId, ethers.parseEther(price));
      await tx.wait();
      toast.success('Listed!', { id: 'list' });
      loadMyNFTs();
    } catch (err) {
      toast.error(err.reason || 'Failed', { id: 'list' });
    }
  };

  if (!account) return (
    <div className="text-center py-20">
      <p className="text-gray-500 mb-4">Connect your wallet to see your NFTs</p>
      <button onClick={connect} className="bg-violet-600 text-white px-6 py-2.5 rounded-xl font-semibold">Connect Wallet</button>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">My NFTs</h1>
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
          {[...Array(4)].map((_, i) => <div key={i} className="bg-gray-900 rounded-2xl aspect-square animate-pulse" />)}
        </div>
      ) : nfts.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <p>You don't own any NFTs yet.</p>
          <Link to="/mint" className="mt-3 inline-block text-violet-400 hover:underline">Mint your first NFT →</Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
          {nfts.map(({ tokenId, metadata, listingId }) => (
            <div key={tokenId} className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
              <div className="aspect-square bg-gray-800">
                {metadata?.image ? (
                  <img src={metadata.image} alt={metadata.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl">🖼</div>
                )}
              </div>
              <div className="p-4">
                <p className="font-semibold truncate">{metadata?.name || `NFT #${tokenId}`}</p>
                <p className="text-xs text-gray-500 mt-0.5">Token #{tokenId}</p>

                {listingId > 0 ? (
                  <Link to={`/listing/${listingId}`}
                    className="mt-3 block text-center text-xs bg-violet-900/40 text-violet-300 border border-violet-700 py-1.5 rounded-lg hover:bg-violet-900/60 transition">
                    Listed — View
                  </Link>
                ) : (
                  <div className="mt-3 flex gap-2">
                    <input
                      type="number" step="0.001" min="0.001"
                      placeholder="Price (ETH)"
                      value={listingForm[tokenId] || ''}
                      onChange={(e) => setListingForm((p) => ({ ...p, [tokenId]: e.target.value }))}
                      className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-violet-500"
                    />
                    <button onClick={() => handleList(tokenId)}
                      className="bg-violet-600 hover:bg-violet-700 text-white text-xs px-3 py-1.5 rounded-lg transition">
                      List
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
