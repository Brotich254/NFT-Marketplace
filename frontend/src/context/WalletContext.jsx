import { createContext, useContext } from 'react';
import { useWallet } from '../hooks/useWallet';
import { useContracts } from '../hooks/useContracts';

const WalletContext = createContext();

export function WalletProvider({ children }) {
  const wallet = useWallet();
  const contracts = useContracts(wallet.signer);
  return (
    <WalletContext.Provider value={{ ...wallet, ...contracts }}>
      {children}
    </WalletContext.Provider>
  );
}

export const useWalletContext = () => useContext(WalletContext);
