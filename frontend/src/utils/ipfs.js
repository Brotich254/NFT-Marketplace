// Convert IPFS URI to HTTP gateway URL
export function ipfsToHttp(uri) {
  if (!uri) return null;
  if (uri.startsWith('ipfs://')) {
    return `https://ipfs.io/ipfs/${uri.slice(7)}`;
  }
  return uri;
}

export async function fetchMetadata(tokenURI) {
  try {
    const url = ipfsToHttp(tokenURI);
    if (!url) return null;
    const res = await fetch(url);
    const data = await res.json();
    return {
      ...data,
      image: ipfsToHttp(data.image),
    };
  } catch {
    return null;
  }
}

// Upload JSON metadata to nft.storage (free IPFS pinning)
// In production, use nft.storage or Pinata API
export function buildMetadataJSON(name, description, imageUrl) {
  return JSON.stringify({ name, description, image: imageUrl });
}
