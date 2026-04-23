import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';
import { useWalletContext } from '../context/WalletContext';
import { fetchMetadata } from '../utils/ipfs';
import toast from 'react-hot-toast';

function shortAddr(addr) {
  return addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : '';
}

export default function ListingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { marketplace, nftContract, account, connect } = useWalletContext();
  const [listing, setListing] = useState(null);
  const [metadata, setMetadata] = useState(null);
  const [buying, setBuying] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (!marketplace || !nftContract) return;
    loadListing();
  }, [marketplace, nftContract, id]);

  const loadListing = async () => {
    try {
      const l = await marketplace.listings(id);
      setListing(l);
      const uri = await nftContract.tokenURI(l.tokenId);
      const meta = await fetchMetadata(uri);
      setMetadata(meta);
    } catch (err) {
      console.error(err);
    }
  };

  const handleBuy = async () => {
    if (!account) { connect(); return; }
    setBuying(true);
    try {
      toast.loading('Buying NFT...', { id: 'buy' });
      const tx = await marketplace.buyNFT(id, { value: listing.price });
      await tx.wait();
      toast.success('NFT purchased!', { id: 'buy' });
      navigate('/my-nfts');
    } catch (err) {
      toast.error(err.reason || 'Transaction failed', { id: 'buy' });
    } finally {
      setBuying(false);
    }
  };

  const handleCancel = async () => {
    setCancelling(true);
    try {
      toast.loading('Cancelling...', { id: 'cancel' });
      const tx = await marketplace.cancelListing(id);
      await tx.wait();
      toast.success('Listing cancelled', { id: 'cancel' });
      navigate('/my-nfts');
    } catch (err) {
      toast.error(err.reason || 'Failed', { id: 'cancel' });
    } finally {
      setCancelling(false);
    }
  };

  if (!listing) return <div className="text-center py-20 text-gray-500">Loading...</div>;

  const price = ethers.formatEther(listing.price);
  const isSeller = account?.toLowerCase() === listing.seller.toLowerCase();
  const isActive = listing.active;

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="grid md:grid-cols-2 gap-10">
        <div className="aspect-square bg-gray-900 rounded-2xl overflow-hidden">
          {metadata?.image ? (
            <img src={metadata.image} alt={metadata.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-6xl">🖼</div>
          )}
        </div>

        <div className="flex flex-col justify-center">
          <h1 className="text-3xl font-bold">{metadata?.name || `NFT #${listing.tokenId}`}</h1>
          <p className="text-gray-400 mt-3">{metadata?.description}</p>

          <div className="mt-6 space-y-2 text-sm text-gray-400">
            <div className="flex justify-between">
              <span>Token ID</span>
              <span className="font-mono text-gray-300">#{listing.tokenId.toString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Seller</span>
              <span className="font-mono text-gray-300">{shortAddr(listing.seller)}</span>
            </div>
            <div className="flex justify-between">
              <span>Status</span>
              <span className={isActive ? 'text-emerald-400' : 'text-red-400'}>{isActive ? 'Active' : 'Sold / Cancelled'}</span>
            </div>
          </div>

          <div className="mt-6 bg-gray-900 border border-gray-800 rounded-2xl p-5">
            <p className="text-sm text-gray-500">Current Price</p>
            <p className="text-3xl font-bold text-violet-400 mt-1">{price} ETH</p>
          </div>

          {isActive && (
            <div className="mt-4 space-y-3">
              {!isSeller && (
                <button onClick={handleBuy} disabled={buying || !account}
                  className="w-full bg-violet-600 hover:bg-violet-700 text-white py-3 rounded-xl font-bold disabled:opacity-50 transition">
                  {buying ? 'Buying...' : account ? `Buy for ${price} ETH` : 'Connect Wallet to Buy'}
                </button>
              )}
              {isSeller && (
                <button onClick={handleCancel} disabled={cancelling}
                  className="w-full border border-red-700 text-red-400 hover:bg-red-900/20 py-3 rounded-xl font-semibold disabled:opacity-50 transition">
                  {cancelling ? 'Cancelling...' : 'Cancel Listing'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
