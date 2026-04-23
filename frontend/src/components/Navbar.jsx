import { Link } from 'react-router-dom';
import { useWalletContext } from '../context/WalletContext';

function shortAddr(addr) {
  return addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : '';
}

export default function Navbar() {
  const { account, connect, disconnect, loading } = useWalletContext();

  return (
    <nav className="bg-gray-900 border-b border-gray-800 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="text-xl font-bold text-violet-400">🖼 NFTVault</Link>
        <div className="flex items-center gap-5 text-sm">
          <Link to="/" className="text-gray-400 hover:text-white transition">Marketplace</Link>
          <Link to="/mint" className="text-gray-400 hover:text-white transition">Mint</Link>
          {account && <Link to="/my-nfts" className="text-gray-400 hover:text-white transition">My NFTs</Link>}
          {account ? (
            <div className="flex items-center gap-2">
              <span className="bg-gray-800 text-violet-300 px-3 py-1.5 rounded-xl text-xs font-mono">
                {shortAddr(account)}
              </span>
              <button onClick={disconnect} className="text-xs text-gray-500 hover:text-red-400 transition">Disconnect</button>
            </div>
          ) : (
            <button onClick={connect} disabled={loading}
              className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-xl text-sm font-semibold disabled:opacity-50 transition">
              {loading ? 'Connecting...' : 'Connect Wallet'}
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
