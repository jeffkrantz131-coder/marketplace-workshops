// Load Pinata JWT token from .env

const PINATA_API_KEY = process.env.REACT_APP_PINATA_API_KEY;
const PINATA_SECRET_KEY = process.env.REACT_APP_PINATA_SECRET_KEY;

//console.log("Pinata API Key:", PINATA_API_KEY); // Should log your key
//console.log("Pinata Secret Key:", PINATA_SECRET_KEY); // Should log your secret

const PINATA_JWT = process.env.REACT_APP_PINATA_JWT;

export const IPFS_GATEWAY = "https://gateway.pinata.cloud/ipfs/";

// Warn if JWT is missing
if (!PINATA_JWT) {
  console.warn(
    "⚠️ Pinata JWT token is missing. File and JSON uploads will fail."
  );
}

/**
 * Upload a file (image) to Pinata via browser HTTP API
 * @param {File | Blob} file
 * @returns {Promise<string>} ipfs://CID
 */
export async function saveContent(file) {
  if (!PINATA_JWT) {
    throw new Error("Pinata JWT is missing. Cannot upload file.");
  }

  const url = "https://api.pinata.cloud/pinning/pinFileToIPFS";
  const formData = new FormData();
  formData.append("file", file);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PINATA_JWT}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Pinata file upload failed: ${errorText}`);
    }

    const result = await response.json();
    console.log("Pinata file upload result:", result);

    return `ipfs://${result.IpfsHash}`;
  } catch (err) {
    console.error("Error uploading file to Pinata:", err);
    throw err;
  }
}

/**
 * Upload JSON metadata to Pinata via browser HTTP API
 * @param {Object} jsonData
 * @returns {Promise<string>} ipfs://CID
 */
export async function saveJSON(jsonData) {
  if (!PINATA_JWT) {
    throw new Error("Pinata JWT is missing. Cannot upload JSON.");
  }

  const url = "https://api.pinata.cloud/pinning/pinJSONToIPFS";

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PINATA_JWT}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(jsonData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Pinata JSON upload failed: ${errorText}`);
    }

    const result = await response.json();
    console.log("Pinata JSON upload result:", result);

    return `ipfs://${result.IpfsHash}`;
  } catch (err) {
    console.error("Error uploading JSON to Pinata:", err);
    throw err;
  }
}
