import { useState } from 'react';
import { ethers } from 'ethers';
import { useWalletContext } from '../context/WalletContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function Mint() {
  const { account, connect, nftContract, marketplace, addresses } = useWalletContext();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', description: '', imageUrl: '', listPrice: '' });
  const [step, setStep] = useState('idle'); // idle | minting | approving | listing | done
  const [tokenId, setTokenId] = useState(null);

  const handleMint = async (e) => {
    e.preventDefault();
    if (!account) { connect(); return; }
    if (!nftContract || !marketplace) { toast.error('Contracts not loaded'); return; }

    try {
      // Build metadata JSON and use a data URI (for demo — in production upload to IPFS)
      const metadata = JSON.stringify({
        name: form.name,
        description: form.description,
        image: form.imageUrl || 'https://placehold.co/400x400?text=NFT',
      });
      const tokenURI = `data:application/json;base64,${btoa(metadata)}`;

      setStep('minting');
      toast.loading('Minting NFT...', { id: 'mint' });

      const tx = await nftContract.mint(account, tokenURI);
      const receipt = await tx.wait();

      // Get tokenId from Transfer event
      const transferEvent = receipt.logs.find((log) => {
        try { return nftContract.interface.parseLog(log)?.name === 'Transfer'; } catch { return false; }
      });
      const parsed = nftContract.interface.parseLog(transferEvent);
      const mintedId = parsed.args.tokenId;
      setTokenId(mintedId);

      toast.success('NFT minted!', { id: 'mint' });

      // If price set, list it
      if (form.listPrice) {
        setStep('approving');
        toast.loading('Approving marketplace...', { id: 'approve' });
        const approveTx = await nftContract.setApprovalForAll(addresses.marketplace, true);
        await approveTx.wait();
        toast.success('Approved!', { id: 'approve' });

        setStep('listing');
        toast.loading('Listing NFT...', { id: 'list' });
        const price = ethers.parseEther(form.listPrice);
        const listTx = await marketplace.listNFT(addresses.nftContract, mintedId, price);
        await listTx.wait();
        toast.success('Listed on marketplace!', { id: 'list' });
      }

      setStep('done');
      setTimeout(() => navigate('/my-nfts'), 1500);
    } catch (err) {
      console.error(err);
      toast.error(err.reason || err.message || 'Transaction failed');
      setStep('idle');
    }
  };

  const stepLabels = { idle: 'Mint NFT', minting: 'Minting...', approving: 'Approving...', listing: 'Listing...', done: 'Done!' };

  return (
    <div className="max-w-lg mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold mb-6">Mint an NFT</h1>

      {!account && (
        <div className="bg-violet-900/30 border border-violet-700 rounded-2xl p-4 text-center mb-6">
          <button onClick={connect} className="bg-violet-600 text-white px-5 py-2 rounded-xl font-semibold">Connect Wallet</button>
        </div>
      )}

      <form onSubmit={handleMint} className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
        <div>
          <label className="text-xs text-gray-500 block mb-1">NFT Name</label>
          <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="My Awesome NFT"
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-1">Description</label>
          <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Describe your NFT..."
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-1">Image URL</label>
          <input value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
            placeholder="https://... or ipfs://..."
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
          {form.imageUrl && (
            <img src={form.imageUrl} alt="preview" className="mt-2 w-full aspect-square object-cover rounded-xl" />
          )}
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-1">List Price (ETH) — optional</label>
          <input type="number" step="0.001" min="0" value={form.listPrice}
            onChange={(e) => setForm({ ...form, listPrice: e.target.value })}
            placeholder="0.1"
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
          <p className="text-xs text-gray-600 mt-1">Leave empty to mint without listing</p>
        </div>
        <button type="submit" disabled={step !== 'idle' || !account}
          className="w-full bg-violet-600 hover:bg-violet-700 text-white py-3 rounded-xl font-bold disabled:opacity-50 transition">
          {stepLabels[step]}
        </button>
      </form>
    </div>
  );
}
