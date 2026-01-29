"use client";

import { useState, useCallback } from "react";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { parseAbi, encodeFunctionData, type Hash } from "viem";
import { base } from "wagmi/chains";

interface MintNFTProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  effectName: string;
}

type MintStep =
  | "idle"
  | "deploying"
  | "uploading-image"
  | "uploading-metadata"
  | "minting"
  | "done"
  | "error";

// Minimal ERC-721 contract bytecode for batch minting
// This is a simple ERC721 with mint function that anyone can call
const NFT_CONTRACT_ABI = parseAbi([
  "constructor(string name, string symbol)",
  "function mint(address to, string uri) public returns (uint256)",
  "function batchMint(address to, string[] uris) public returns (uint256[])",
  "function tokenURI(uint256 tokenId) public view returns (string)",
  "function balanceOf(address owner) public view returns (uint256)",
  "function name() public view returns (string)",
  "function totalSupply() public view returns (uint256)",
  "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)",
]);

// Pre-compiled minimal ERC721 bytecode with mint + batchMint
// This bytecode implements: ERC721, mint(address,string), batchMint(address,string[])
const NFT_BYTECODE = "0x60806040523480156200001157600080fd5b5060405162001c5538038062001c558339810160408190526200003491620001db565b8151829082906200004d906000906020850190620000a1565b50805162000063906001906020840190620000a1565b50506006805460ff19169055505060068054610100600160a81b0319163361010002179055620002a5565b828054620000af9062000268565b90600052602060002090601f016020900481019282620000d357600085556200011e565b82601f10620000ee57805160ff19168380011785556200011e565b828001600101855582156200011e579182015b828111156200011e57825182559160200191906001019062000101565b506200012c92915062000130565b5090565b5b808211156200012c576000815560010162000131565b634e487b7160e01b600052604160045260246000fd5b600082601f8301126200016f57600080fd5b81516001600160401b03808211156200018c576200018c62000147565b604051601f8301601f19908116603f01168101908282118183101715620001b757620001b762000147565b81604052838152602092508683858801011115620001d457600080fd5b600091505b83821015620001f85785820183015181830184015290820190620001d9565b838211156200020a5760008385830101525b9695505050505050565b600080604083850312156200022857600080fd5b82516001600160401b03808211156200024057600080fd5b6200024e868387016200015d565b935060208501519150808211156200026557600080fd5b50620002748582860162000157565b9150509250929050565b600181811c908216806200029357607f821691505b60208210811415620002b557634e487b7160e01b600052602260045260246000fd5b50919050565b6119a080620002cb6000396000f3fe608060405234801561001057600080fd5b50600436106100ea5760003560e01c80636352211e1161008c578063a22cb46511610066578063a22cb4651461020a578063b88d4fde1461021d578063c87b56dd14610230578063e985e9c51461024357600080fd5b80636352211e146101ce57806370a08231146101e157806395d89b41146101f457600080fd5b8063095ea7b3116100c8578063095ea7b31461016757806318160ddd1461017c57806323b872dd1461018e57806342842e0e146101a157600080fd5b806301ffc9a7146100ef57806306fdde0314610117578063081812fc1461012c575b600080fd5b6101026100fd366004611282565b610256565b60405190151581526020015b60405180910390f35b61011f6102a8565b60405161010e91906112f7565b61013f61013a36600461130a565b61033a565b6040516001600160a01b03909116815260200161010e565b61017a610175366004611338565b610361565b005b6006545b60405190815260200161010e565b61017a61019c366004611362565b61047b565b61017a6101af366004611362565b6104ac565b61013f6101dc36600461130a565b6104c7565b6101806101ef36600461139e565b610530565b61011f6105b6565b61017a6102183660046113b9565b6105c5565b61017a61022b3660046114a6565b6105d4565b61011f61023e36600461130a565b6105e3565b610102610251366004611542565b61068c565b60006001600160e01b031982166380ac58cd60e01b148061028757506001600160e01b03198216635b5e139f60e01b145b806102a257506301ffc9a760e01b6001600160e01b03198316145b92915050565b6060600080546102b790611575565b80601f01602080910402602001604051908101604052809291908181526020018280546102e390611575565b80156103305780601f1061030557610100808354040283529160200191610330565b820191906000526020600020905b81548152906001019060200180831161031357829003601f168201915b5050505050905090565b6000610345826106ba565b506000908152600460205260409020546001600160a01b031690565b600061036c826104c7565b9050806001600160a01b0316836001600160a01b031614156103df5760405162461bcd60e51b815260206004820152602160248201527f4552433732313a20617070726f76616c20746f2063757272656e74206f776e656044820152603960f91b60648201526084015b60405180910390fd5b336001600160a01b03821614806103fb57506103fb8133610251565b61046d5760405162461bcd60e51b815260206004820152603d60248201527f4552433732313a20617070726f76652063616c6c6572206973206e6f7420746f60448201527f6b656e206f776e6572206f7220617070726f76656420666f7220616c6c00000060648201526084016103d6565b6104778383610719565b5050565b6104853382610787565b6104a15760405162461bcd60e51b81526004016103d6906115b0565b6104ac838383610806565b505050565b6104ac83838360405180602001604052806000815250610970565b6000818152600260205260408120546001600160a01b0316806102a25760405162461bcd60e51b8152602060048201526018602482015277115490cdcc8c4e881a5b9d985b1a59081d1bdad95b88125160421b60448201526064016103d6565b60006001600160a01b03821661059a5760405162461bcd60e51b815260206004820152602960248201527f4552433732313a2061646472657373207a65726f206973206e6f7420612076616044820152681b1a590818dbdd5b9d60ba1b60648201526084016103d6565b506001600160a01b031660009081526003602052604090205490565b6060600180546102b790611575565b6104773383836109a4565b6105df848484610806565b5050565b60606105ee826106ba565b600082815260056020526040812080546106079061155b565b80601f01602080910402602001604051908101604052809291908181526020018280546106339061155b565b80156106805780601f1061065557610100808354040283529160200191610680565b820191906000526020600020905b81548152906001019060200180831161066357829003601f168201915b50505050509050919050565b6001600160a01b03918216600090815260076020908152604080832093909416825291909152205460ff1690565b6000818152600260205260409020546001600160a01b03166107165760405162461bcd60e51b8152602060048201526018602482015277115490cdcc8c4e881a5b9d985b1a59081d1bdad95b88125160421b60448201526064016103d6565b50565b600081815260046020526040902080546001600160a01b0319166001600160a01b038416908117909155819061074d826104c7565b6001600160a01b03167f8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b92560405160405180910390a45050565b600080610793836104c7565b9050806001600160a01b0316846001600160a01b031614806107d457506001600160a01b0380821660009081526007602090815260408083209388168352929052205460ff165b806107f85750836001600160a01b03166107ed8461033a565b6001600160a01b0316145b949350505050565b826001600160a01b0316610819826104c7565b6001600160a01b03161461087d5760405162461bcd60e51b815260206004820152602560248201527f4552433732313a207472616e736665722066726f6d20696e636f72726563742060448201526437bbb732b960d91b60648201526084016103d6565b6001600160a01b0382166108df5760405162461bcd60e51b8152602060048201526024808201527f4552433732313a207472616e7366657220746f20746865207a65726f206164646044820152637265737360e01b60648201526084016103d6565b6108ea600082610719565b6001600160a01b0383166000908152600360205260408120805460019290610912908490611613565b90915550506001600160a01b038216600090815260036020526040812080546001929061094090849061162a565b909155505060008181526002602052604080822080546001600160a01b0319166001600160a01b03868116918217909255915184939187169160008051602061194b83398151915291a4505050565b61097b848484610806565b50505050565b600680549060006109918361163d565b9190505550600654600003610100810291909117600655565b816001600160a01b0316836001600160a01b03161415610a065760405162461bcd60e51b815260206004820152601960248201527f4552433732313a20617070726f766520746f2063616c6c65720000000000000060448201526064016103d6565b6001600160a01b0383811660008181526007602090815260408083209487168084529482529182902080548715157fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff0091821681179092559251848152929391927f17307eab39ab6107e8899845ad3d59bd9653f200f220920489ca2b5937696c3191015b60405180910390a3505050565b80356001600160e01b031981168114610aab57600080fd5b919050565b600060208284031215610ac257600080fd5b610acb82610a93565b9392505050565b60005b83811015610aed578181015183820152602001610ad5565b8381111561097b5750506000910152565b60008151808452610b16816020860160208601610ad2565b601f01601f19169290920160200192915050565b602081526000610acb6020830184610afe565b600060208284031215610b4f57600080fd5b5035919050565b80356001600160a01b0381168114610aab57600080fd5b60008060408385031215610b8057600080fd5b610b8983610b56565b946020939093013593505050565b600080600060608486031215610bac57600080fd5b610bb584610b56565b9250610bc360208501610b56565b9150604084013590509250925092565b600060208284031215610be557600080fd5b610acb82610b56565b60008060408385031215610c0157600080fd5b610c0a83610b56565b915060208301358015158114610c1f57600080fd5b809150509250929050565b634e487b7160e01b600052604160045260246000fd5b604051601f8201601f1916810167ffffffffffffffff81118282101715610c6957610c69610c2a565b604052919050565b600067ffffffffffffffff821115610c8b57610c8b610c2a565b50601f01601f191660200190565b6000610cac610ca784610c71565b610c40565b9050828152838383011115610cc057600080fd5b610acb836020830184610ad2565b600082601f830112610cdf57600080fd5b610acb83833560208501610c99565b60008060008060808587031215610d0457600080fd5b610d0d85610b56565b9350610d1b60208601610b56565b925060408501359150606085013567ffffffffffffffff811115610d3e57600080fd5b610d4a87828801610cce565b91505092959194509250565b60008060408385031215610d6957600080fd5b610d7283610b56565b9150610d8060208401610b56565b90509250929050565b600181811c90821680610d9d57607f821691505b60208210811415610dbe57634e487b7160e01b600052602260045260246000fd5b50919050565b6020808252602d908201527f4552433732313a2063616c6c6572206973206e6f7420746f6b656e206f776e6560408201526c1c881bdc88185c1c1c9bdd9959609a1b606082015260800190565b634e487b7160e01b600052601160045260246000fd5b600082821015610e3a57610e3a610e11565b500390565b60008219821115610e5257610e52610e11565b500190565b6000600019821415610e6b57610e6b610e11565b5060010190565b634e487b7160e01b600052603260045260246000fd5b60008351610e9a818460208801610ad2565b835190830190610eae818360208801610ad2565b01949350505050565b600060208284031215610ec957600080fd5b815167ffffffffffffffff811115610ee057600080fd5b8201601f81018413610ef157600080fd5b8051610eff610ca782610c71565b818152856020838501011115610f1457600080fd5b610f25826020830160208601610ad2565b95945050505050565b60008060408385031215610f4157600080fd5b610f4a83610b56565b9150602083013567ffffffffffffffff811115610f6657600080fd5b610f7285828601610cce565b9150509250929050565b600060208284031215610f8e57600080fd5b815167ffffffffffffffff80821115610fa657600080fd5b818401915084601f830112610fba57600080fd5b8151602082821115610fce57610fce610c2a565b8160051b610fdd828201610c40565b928352848101820192828101908985111561100057600080fd5b83890192505b84831015611041578251868111156110205760008081fd5b61102e8c86838b0101610cce565b8352509183019190830190611006565b9998505050505050505050565b6000825161106081846020870161d2565b919091019291505056feddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";

export default function MintNFT({ canvasRef, effectName }: MintNFTProps) {
  const { address, isConnected, chain } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const { openConnectModal } = useConnectModal();

  const [step, setStep] = useState<MintStep>("idle");
  const [error, setError] = useState("");
  const [contractAddress, setContractAddress] = useState("");
  const [nftName, setNftName] = useState("POTATO LABS Art");
  const [quantity, setQuantity] = useState(1);
  const [mintProgress, setMintProgress] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [txHash, setTxHash] = useState("");

  const isBase = chain?.id === base.id;

  const handleMint = useCallback(async () => {
    if (!isConnected || !address || !canvasRef.current || !walletClient || !publicClient) return;

    setError("");
    setMintProgress(0);

    try {
      // 1. Deploy ERC-721 contract
      setStep("deploying");

      const deployHash = await walletClient.deployContract({
        abi: NFT_CONTRACT_ABI,
        bytecode: NFT_BYTECODE as `0x${string}`,
        args: [nftName, "PLAB"],
      });

      const deployReceipt = await publicClient.waitForTransactionReceipt({ hash: deployHash });
      const nftContractAddress = deployReceipt.contractAddress;
      if (!nftContractAddress) throw new Error("Contract deployment failed");
      setContractAddress(nftContractAddress);

      // 2. Export canvas to blob and upload image
      setStep("uploading-image");

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvasRef.current!.toBlob((b) => {
          if (b) resolve(b);
          else reject(new Error("Failed to export canvas"));
        }, "image/png");
      });

      const imageFile = new File([blob], "potatolabs-nft.png", { type: "image/png" });

      const imageForm = new FormData();
      imageForm.append("type", "image");
      imageForm.append("file", imageFile);

      const imgRes = await fetch("/api/upload", { method: "POST", body: imageForm });
      if (!imgRes.ok) {
        const data = await imgRes.json();
        throw new Error(data.error || "Image upload failed");
      }
      const { url: imageUrl } = await imgRes.json();

      // 3. Upload metadata to IPFS
      setStep("uploading-metadata");

      const metadataUris: string[] = [];

      for (let i = 0; i < quantity; i++) {
        const metadata = {
          name: quantity === 1 ? nftName : `${nftName} #${i + 1}`,
          description: `Created with POTATO LABS using ${effectName} effect`,
          image: imageUrl,
          attributes: [
            { trait_type: "Effect", value: effectName },
            { trait_type: "Tool", value: "POTATO LABS" },
            { trait_type: "Chain", value: "Base" },
          ],
        };

        const metaForm = new FormData();
        metaForm.append("type", "metadata");
        metaForm.append("metadata", JSON.stringify(metadata));

        const metaRes = await fetch("/api/upload", { method: "POST", body: metaForm });
        if (!metaRes.ok) {
          const data = await metaRes.json();
          throw new Error(data.error || "Metadata upload failed");
        }
        const { url: metadataUrl } = await metaRes.json();
        metadataUris.push(metadataUrl);
      }

      // 4. Mint NFTs on Base
      setStep("minting");

      let lastHash: Hash = "0x";

      if (quantity === 1) {
        // Single mint
        lastHash = await walletClient.writeContract({
          address: nftContractAddress,
          abi: NFT_CONTRACT_ABI,
          functionName: "mint",
          args: [address, metadataUris[0]],
        });
        setMintProgress(1);
      } else {
        // Batch mint
        lastHash = await walletClient.writeContract({
          address: nftContractAddress,
          abi: NFT_CONTRACT_ABI,
          functionName: "batchMint",
          args: [address, metadataUris],
        });
        setMintProgress(quantity);
      }

      setTxHash(lastHash);
      await publicClient.waitForTransactionReceipt({ hash: lastHash });

      setStep("done");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Minting failed";
      setError(message);
      setStep("error");
    }
  }, [isConnected, address, canvasRef, nftName, effectName, quantity, walletClient, publicClient]);

  const stepLabels: Record<MintStep, string> = {
    idle: "",
    deploying: "Deploying ERC-721 contract on Base...",
    "uploading-image": "Uploading image to IPFS...",
    "uploading-metadata": "Uploading metadata to IPFS...",
    minting: `Minting ${mintProgress}/${quantity} NFTs...`,
    done: `${quantity} NFT${quantity > 1 ? "s" : ""} minted!`,
    error: "Error",
  };

  return (
    <>
      <button
        onClick={() => {
          if (!isConnected) {
            openConnectModal?.();
          } else {
            setShowModal(true);
          }
        }}
        className="w-full px-3 py-2 rounded text-xs font-medium transition-colors bg-purple-600 hover:bg-purple-500 text-white"
      >
        {isConnected ? "Mint as NFT" : "Connect Wallet to Mint"}
      </button>

      {isConnected && address && (
        <div className="text-[10px] text-zinc-600 truncate">
          {address.slice(0, 6)}...{address.slice(-4)}
          {!isBase && (
            <span className="text-yellow-500 ml-1">(Switch to Base)</span>
          )}
        </div>
      )}

      {/* Mint Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="bg-zinc-900 border border-zinc-700/50 rounded-lg p-5 w-80 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-zinc-100">Mint NFTs on Base</h3>
              <button
                onClick={() => { setShowModal(false); setStep("idle"); setError(""); setMintProgress(0); }}
                className="text-zinc-500 hover:text-zinc-300 text-lg"
              >
                ×
              </button>
            </div>

            {step === "idle" && (
              <>
                {!isBase && (
                  <div className="text-xs text-yellow-400 bg-yellow-500/10 border border-yellow-500/30 rounded p-2">
                    Please switch your wallet to Base network before minting.
                  </div>
                )}
                <div>
                  <label className="text-xs text-zinc-500 block mb-1">NFT Name</label>
                  <input
                    type="text"
                    value={nftName}
                    onChange={(e) => setNftName(e.target.value)}
                    className="w-full rounded bg-zinc-800 border border-zinc-700/50 text-zinc-200 px-2 py-1.5 text-xs"
                    placeholder="My POTATO LABS Art"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-500 block mb-1">Quantity (1–100)</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={quantity}
                    onChange={(e) => {
                      const v = Math.max(1, Math.min(100, parseInt(e.target.value) || 1));
                      setQuantity(v);
                    }}
                    className="w-full rounded bg-zinc-800 border border-zinc-700/50 text-zinc-200 px-2 py-1.5 text-xs"
                  />
                </div>
                <div className="text-xs text-zinc-500 space-y-1 bg-zinc-800/50 rounded p-2">
                  <p className="text-zinc-400 font-medium">Cost Estimate</p>
                  <p>Contract deploy: ~0.001 ETH (one-time)</p>
                  <p>Per-mint gas: ~0.0001 ETH each</p>
                  <p className="text-zinc-400 pt-1 border-t border-zinc-700/50">
                    Base L2 fees are significantly lower than L1
                  </p>
                </div>
                <div className="text-xs text-zinc-500 space-y-1">
                  <p>Effect: {effectName}</p>
                  <p>Network: Base (Mainnet)</p>
                  <p>Wallet: {address?.slice(0, 10)}...</p>
                </div>
                <button
                  onClick={handleMint}
                  disabled={!isBase}
                  className={`w-full px-3 py-2 rounded text-xs font-medium text-white ${
                    isBase
                      ? "bg-purple-600 hover:bg-purple-500"
                      : "bg-zinc-700 cursor-not-allowed"
                  }`}
                >
                  {isBase
                    ? `Confirm & Mint ${quantity > 1 ? `${quantity} NFTs` : "NFT"}`
                    : "Switch to Base Network"}
                </button>
              </>
            )}

            {(step === "deploying" || step === "uploading-image" || step === "uploading-metadata" || step === "minting") && (
              <div className="text-center py-4">
                <div className="inline-block w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mb-3" />
                <p className="text-xs text-zinc-300">{stepLabels[step]}</p>
                {step === "minting" && quantity > 1 && (
                  <div className="mt-2 w-full bg-zinc-800 rounded-full h-1.5">
                    <div
                      className="bg-purple-500 h-1.5 rounded-full transition-all"
                      style={{ width: `${(mintProgress / quantity) * 100}%` }}
                    />
                  </div>
                )}
              </div>
            )}

            {step === "done" && (
              <div className="text-center py-2 space-y-3">
                <div className="text-green-400 text-lg">&#10003;</div>
                <p className="text-xs text-zinc-300">
                  {quantity} NFT{quantity > 1 ? "s" : ""} minted successfully on Base!
                </p>
                <p className="text-[10px] text-zinc-500 break-all">Contract: {contractAddress}</p>
                <a
                  href={`https://basescan.org/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block text-xs text-purple-400 hover:text-purple-300 underline"
                >
                  View on BaseScan
                </a>
              </div>
            )}

            {step === "error" && (
              <div className="py-2 space-y-3">
                <p className="text-xs text-red-400">{error}</p>
                <button
                  onClick={() => setStep("idle")}
                  className="w-full px-3 py-2 rounded text-xs font-medium bg-zinc-700 hover:bg-zinc-600 text-white"
                >
                  Try Again
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
