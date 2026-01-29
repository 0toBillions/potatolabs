# POTATO LABS

A web-based tool that converts images, GIFs, and videos into ASCII art, dithered graphics, and retro visual effects — with built-in NFT minting on **Base** (Coinbase L2).

## Features

### 9 Visual Effects
- **ASCII Art** — Map pixels to characters by brightness with 11 character sets, color modes, and full image adjustments (brightness, contrast, saturation, hue, gamma)
- **Floyd-Steinberg Dither** — Classic error diffusion dithering
- **Atkinson Dither** — Higher contrast dithering (used by early Mac)
- **Ordered Dither** — Bayer matrix pattern dithering (2x2, 4x4, 8x8)
- **Matrix Rain** — Animated falling green characters with source image modulation
- **Edge Detection** — Sobel operator edge outlines
- **Halftone** — CMYK-style rotatable dot pattern
- **Pixel Art** — Block-level color averaging with optional palette quantization
- **Scanlines** — CRT monitor horizontal lines

### NFT Minting on Base
- Connect any EVM wallet via RainbowKit (MetaMask, Coinbase Wallet, WalletConnect, etc.)
- Deploy your own ERC-721 contract directly from the UI
- Mint single or batch NFTs with metadata stored on IPFS via Pinata
- View transactions on BaseScan

### Media Support
- **Images**: PNG, JPG, WebP, BMP
- **Animated**: GIF, MP4, WebM
- Real-time effect rendering with requestAnimationFrame

### Export
- PNG, JPEG, or plain text (ASCII mode)

## Getting Started

### Prerequisites
- Node.js 18+
- A [WalletConnect Project ID](https://cloud.walletconnect.com) (for wallet connection)
- A [Pinata](https://pinata.cloud) JWT (for IPFS uploads during NFT minting)

### Setup

```bash
git clone https://github.com/0toBillions/potatolabs.git
cd potatolabs
npm install
```

Create a `.env.local` file:

```env
PINATA_JWT=your_pinata_jwt_here
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id_here
NEXT_PUBLIC_PINATA_GATEWAY=gateway.pinata.cloud
```

### Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Build

```bash
npm run build
npm start
```

## Tech Stack

- **Framework**: Next.js 16, React 19, TypeScript
- **Styling**: Tailwind CSS v4
- **Wallet**: wagmi, viem, RainbowKit
- **Chain**: Base (Coinbase L2)
- **NFT**: ERC-721 with on-chain deployment
- **Storage**: Pinata / IPFS
- **Processing**: HTML Canvas API (client-side)

## How It Works

1. Upload an image, GIF, or video
2. Pick an effect from the left sidebar
3. Adjust settings in the right sidebar
4. Export as PNG/JPEG/TXT or mint as an NFT on Base

## License

MIT
