# EIP-7702 Session Signing Demo

A web-based demonstration application for signing EIP-7702 session keys using browser wallets like MetaMask or OKX Wallet.

## 🌟 Features

- **Wallet Connection**: Connect to Ethereum wallets via browser extension
- **EIP-7702 Compatibility Check**: Automatically detects if connected account supports EIP-7702
- **Session Signing**: Sign structured session data using EIP-712 typed data standard
- **Modern UI**: Clean, responsive interface built with Tailwind CSS
- **Real-time Status**: Live updates on connection and signing status

## 🚀 Quick Start

### Prerequisites

- Node.js (v16 or higher)
- A browser wallet extension (MetaMask, OKX Wallet, etc.)
- Modern web browser with JavaScript enabled

### Installation

1. Clone the repository:
```bash
git clone https://github.com/tsubasakong/eip7702-sign-session-frontend-demo.git
cd eip7702-sign-session-frontend-demo
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to the local development URL (typically `http://localhost:5173`)

### Production Build

To build the project for production:

```bash
npm run build
```

To preview the production build:

```bash
npm run preview
```

## 🔧 How It Works

### EIP-7702 Compatibility Detection

The application checks if a connected Ethereum address has existing bytecode:
- **Has Code**: Account is EIP-7702 ready or already a smart contract
- **No Code**: Standard Externally Owned Account (EOA)

### Session Signing Process

The demo signs a structured session object using EIP-712 typed data:

```javascript
const session = {
    signer: userAddress,           // Connected wallet address
    executor: executorAddress,     // Executor contract address
    nonce: randomNonce,           // Secure random value
    deadline: futureTimestamp     // Session expiry time
}
```

### EIP-712 Domain

```javascript
const domain = {
    name: 'Executor',
    version: '1',
    chainId: 1,                   // Ethereum Mainnet
    verifyingContract: executorAddress
}
```

## 🛠 Technology Stack

- **Frontend Framework**: Vanilla JavaScript with Vite
- **Styling**: Tailwind CSS
- **Blockchain Library**: Ethers.js v6
- **Build Tool**: Vite
- **Standards**: EIP-712 (Typed Data), EIP-7702 (Account Abstraction)

## 📁 Project Structure

```
eip7702-sign-session-frontend-demo/
├── index.html          # Main HTML file
├── main.js             # Core JavaScript functionality
├── package.json        # Project dependencies and scripts
├── package-lock.json   # Lock file for dependencies
└── README.md          # Project documentation
```

## 🔍 Key Functions

### `connectWallet()`
- Detects available Ethereum provider
- Requests account access
- Checks EIP-7702 compatibility
- Updates UI with connection status

### `signSessionData()`
- Constructs EIP-712 typed data payload
- Generates secure random nonce
- Sets session deadline
- Requests signature from wallet
- Displays result or error

## 🔗 EIP Standards

This project demonstrates:

- **[EIP-712](https://eips.ethereum.org/EIPS/eip-712)**: Ethereum typed structured data hashing and signing
- **[EIP-7702](https://eips.ethereum.org/EIPS/eip-7702)**: Set EOA account code for one transaction

## 🔒 Security Considerations

- Uses secure random nonce generation
- Implements proper error handling
- Session deadlines prevent replay attacks
- Clear user confirmation for all signatures

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the ISC License - see the LICENSE file for details.

## 🆘 Support

If you encounter any issues or have questions:

1. Check the browser console for error messages
2. Ensure your wallet is properly connected to Ethereum Mainnet
3. Verify that your browser wallet extension is enabled and unlocked
4. Open an issue in this repository for additional support

## 🔗 Useful Links

- [EIP-712 Specification](https://eips.ethereum.org/EIPS/eip-712)
- [EIP-7702 Specification](https://eips.ethereum.org/EIPS/eip-7702)
- [Ethers.js Documentation](https://docs.ethers.org/)
- [MetaMask Developer Docs](https://docs.metamask.io/) 