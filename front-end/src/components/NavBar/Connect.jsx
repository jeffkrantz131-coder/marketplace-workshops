import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.css";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { updateUserData, disconnect } from "../../features/userData";
import { ethers, utils } from "ethers";
import Web3Modal from "web3modal";
import axios from "axios";
import Account from "./Account";
import networks from "../../utils/networksMap.json";
import useComponentVisible from "../../hooks/visible";
import Button from "../Button";
import artistsContract from "../../artifacts/AARTArtists.sol/AARTArtists.json";
import { IPFS_GATEWAY } from "../../utils/ipfsStorage";
import { artistsContractAddress, networkDeployedTo } from "../../utils/contracts-config";
import { defaultProfileImg } from "../../utils/helpers";

let web3Modal;

function Connect() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const wallet = useSelector((state) => state.userData.value);

  const [injectedProvider, setInjectedProvider] = useState(null);
  const [profileVisible, setProfileVisible] = useState(false);

  const { ref, isComponentVisible, setIsComponentVisible } = useComponentVisible(true, setProfileVisible);

  const handleProfileClick = () => {
    setProfileVisible(!profileVisible);
    setIsComponentVisible(true);
  };

  async function fetchAccountData() {
    try {
      if (!window.ethereum) {
        alert("Please install MetaMask!");
        return;
      }

      // Initialize Web3Modal if not already
      if (!web3Modal) web3Modal = new Web3Modal({ cacheProvider: true });

      const connection = await web3Modal.connect();
      const provider = new ethers.providers.Web3Provider(connection);
      setInjectedProvider(provider); // optional, can be removed if you want

      const signer = provider.getSigner();
      const account = await signer.getAddress();
      const balance = await signer.getBalance();
      const chainId = (await provider.getNetwork()).chainId;

      console.log("MetaMask chainId (decimal):", chainId);
      console.log("MetaMask chainId (hex):", "0x" + chainId.toString(16));
      console.log("Network name from networksMap:", networks[String(chainId)]);
      console.log("Expected network:", networkDeployedTo);

      // Network mismatch handling
      if (networks[String(chainId)] !== networkDeployedTo) {
        try {
          // Try to auto-switch network (MetaMask)
          await window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: "0x" + parseInt(chainId).toString(16) }], // Change if needed
          });
        } catch (switchError) {
          alert(`Please switch your wallet to ${networkDeployedTo}`);
          return;
        }
      }

      // Default profile data
      let username = "Jane Doe";
      let profileImg = defaultProfileImg;
      let registered = false;

      const artists_contract = new ethers.Contract(artistsContractAddress, artistsContract.abi, provider);

      const hasProfile = await artists_contract.hasProfile(account);
      if (hasProfile) {
        const userProfile = await artists_contract.getUserProfile(account);
        const _metadata = await axios.get(userProfile[1].replace("ipfs://", IPFS_GATEWAY));
        registered = true;
        username = _metadata.data.username;
        profileImg = _metadata.data.imageUri.replace("ipfs://", IPFS_GATEWAY);
      }

      dispatch(
        updateUserData({
          account,
          balance: utils.formatUnits(balance),
          network: networks[String(chainId)],
          registered,
          username,
          profileImg,
        })
      );
    } catch (err) {
      console.error("Wallet connection failed:", err);
      alert("Failed to connect wallet. Check your network or RPC endpoint.");
    }
  }

  async function disconnectWallet() {
    if (web3Modal) web3Modal.clearCachedProvider();

    if (injectedProvider && injectedProvider.provider && typeof injectedProvider.provider.disconnect === "function") {
      await injectedProvider.provider.disconnect();
      setInjectedProvider(null);
    }

    dispatch(disconnect());
    navigate("/");
  }

  // Hot reload safe event listeners
  useEffect(() => {
    if (window.ethereum) {
      const eth = window.ethereum;

      const handleChainChanged = () => fetchAccountData();
      const handleAccountsChanged = () => fetchAccountData();

      eth.on("chainChanged", handleChainChanged);
      eth.on("accountsChanged", handleAccountsChanged);

      return () => {
        eth.removeListener("chainChanged", handleChainChanged);
        eth.removeListener("accountsChanged", handleAccountsChanged);
      };
    }
  }, []);

  const isConnected = wallet.account && wallet.account !== "";

  return (
    <>
      {isConnected ? (
        <div className="navbar-container-account-box">
          <div className="navbar-container-account" ref={ref}>
            <img
              className="navbar-container-account"
              src={wallet.profileImg}
              alt="Profile"
              width="40px"
              height="40px"
              onClick={handleProfileClick}
            />

            {profileVisible && isComponentVisible && (
              <Account currentAccount={wallet.account} disconnect={disconnectWallet} />
            )}
          </div>
        </div>
      ) : (
        <Button btnName="Connect Wallet" handleClick={fetchAccountData} />
      )}
    </>
  );
}

export default Connect;
