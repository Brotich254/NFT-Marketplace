import { useMemo } from 'react';
import { ethers } from 'ethers';
import addresses from '../contracts/addresses.json';
import NFTAbi from '../contracts/MarketplaceNFT.json';
import MarketplaceAbi from '../contracts/NFTMarketplace.json';

export function useContracts(signer) {
  const nftContract = useMemo(() => {
    if (!signer) return null;
    return new ethers.Contract(addresses.nftContract, NFTAbi, signer);
  }, [signer]);

  const marketplace = useMemo(() => {
    if (!signer) return null;
    return new ethers.Contract(addresses.marketplace, MarketplaceAbi, signer);
  }, [signer]);

  return { nftContract, marketplace, addresses };
}
