import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { WalletProvider } from './context/WalletContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Mint from './pages/Mint';
import MyNFTs from './pages/MyNFTs';
import ListingDetail from './pages/ListingDetail';

export default function App() {
  return (
    <WalletProvider>
      <BrowserRouter>
        <Toaster position="top-right" toastOptions={{ style: { background: '#1f2937', color: '#f9fafb' } }} />
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/mint" element={<Mint />} />
          <Route path="/my-nfts" element={<MyNFTs />} />
          <Route path="/listing/:id" element={<ListingDetail />} />
        </Routes>
      </BrowserRouter>
    </WalletProvider>
  );
}
