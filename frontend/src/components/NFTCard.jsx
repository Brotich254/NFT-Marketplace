import { Link } from 'react-router-dom';
import { ethers } from 'ethers';

export default function NFTCard({ listing, metadata }) {
  const price = listing?.price ? ethers.formatEther(listing.price) : null;

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden hover:border-violet-700 transition group">
      <div className="aspect-square bg-gray-800 overflow-hidden">
        {metadata?.image ? (
          <img src={metadata.image} alt={metadata.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl">🖼</div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-semibold truncate">{metadata?.name || `NFT #${listing?.tokenId}`}</h3>
        <p className="text-xs text-gray-500 mt-0.5 truncate">{metadata?.description || ''}</p>
        <div className="flex items-center justify-between mt-3">
          {price && (
            <div>
              <p className="text-xs text-gray-500">Price</p>
              <p className="font-bold text-violet-400">{price} ETH</p>
            </div>
          )}
          {listing && (
            <Link to={`/listing/${listing.listingId}`}
              className="bg-violet-600 hover:bg-violet-700 text-white text-xs px-3 py-1.5 rounded-lg transition">
              View
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
