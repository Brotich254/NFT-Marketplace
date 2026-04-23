import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';

export function useWallet() {
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [loading, setLoading] = useState(false);

  const connect = useCallback(async () => {
    if (!window.ethereum) {
      alert('MetaMask not found. Please install it.');
      return;
    }
    setLoading(true);
    try {
      const _provider = new ethers.BrowserProvider(window.ethereum);
      await _provider.send('eth_requestAccounts', []);
      const _signer = await _provider.getSigner();
      const _account = await _signer.getAddress();
      const network = await _provider.getNetwork();

      setProvider(_provider);
      setSigner(_signer);
      setAccount(_account);
      setChainId(network.chainId.toString());
    } catch (err) {
      console.error('Wallet connect error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const disconnect = () => {
    setAccount(null);
    setProvider(null);
    setSigner(null);
    setChainId(null);
  };

  useEffect(() => {
    if (!window.ethereum) return;

    // Auto-connect if already authorized
    window.ethereum.request({ method: 'eth_accounts' }).then((accounts) => {
      if (accounts.length > 0) connect();
    });

    window.ethereum.on('accountsChanged', (accounts) => {
      if (accounts.length === 0) disconnect();
      else connect();
    });
    window.ethereum.on('chainChanged', () => connect());

    return () => {
      window.ethereum?.removeAllListeners?.('accountsChanged');
      window.ethereum?.removeAllListeners?.('chainChanged');
    };
  }, [connect]);

  return { account, provider, signer, chainId, loading, connect, disconnect };
}
