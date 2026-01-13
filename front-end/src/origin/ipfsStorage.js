const PINATA_API_KEY = process.env.REACT_APP_PINATA_API_KEY;
const PINATA_SECRET_KEY = process.env.REACT_APP_PINATA_SECRET_KEY;

console.log("Pinata API Key:", PINATA_API_KEY); // Should log your key
console.log("Pinata Secret Key:", PINATA_SECRET_KEY); // Should log your secret

export const IPFS_GATEWAY = "https://gateway.pinata.cloud/ipfs/";

/**
 * Upload a file (image) to Pinata via HTTP API (browser-safe)
 */
export async function saveContent(file) {
  if (!PINATA_API_KEY || !PINATA_SECRET_KEY) {
    throw new Error("Pinata API key or secret is missing");
  }

  const url = "https://api.pinata.cloud/pinning/pinFileToIPFS";
  const formData = new FormData();
  formData.append("file", file);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PINATA_API_KEY}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Pinata upload failed: ${errorText}`);
    }

    const result = await response.json();
    return `ipfs://${result.IpfsHash}`;
  } catch (err) {
    console.error("Error uploading to Pinata:", err);
    throw err;
  }
}

/**
 * Upload JSON metadata to Pinata (browser-safe)
 */
export async function saveJSON(jsonData) {
  const url = "https://api.pinata.cloud/pinning/pinJSONToIPFS";

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PINATA_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(jsonData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Pinata JSON upload failed: ${errorText}`);
    }

    const result = await response.json();
    return `ipfs://${result.IpfsHash}`;
  } catch (err) {
    console.error(err);
    throw err;
  }
}
