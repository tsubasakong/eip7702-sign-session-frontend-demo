# EIP-7702 Session Signing Demo

A demonstration application for signing session data using EIP-7702 smart wallets, with session storage capabilities via CloudFlare R2.

## Features

- ✅ **EIP-7702 Smart Wallet Integration**: Connect and interact with EIP-7702 upgraded wallets
- ✅ **Session Data Signing**: Sign structured session data using EIP-712 typed data
- ✅ **Backend Proxy Storage**: Store session data securely via backend API (no CORS issues)
- ✅ **Real-time Validation**: Check wallet EIP-7702 compatibility and smart contract integration
- ✅ **Session Retrieval**: Get existing session data via API endpoints

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Create a `.env` file in the project root:
```env
# CloudFlare R2 Configuration
VITE_S3_ACCESS_KEY=your_access_key_here
VITE_S3_SECRET_KEY=your_secret_key_here
VITE_S3_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com
VITE_S3_REGION=auto

# Backend Configuration (Optional)
VITE_BACKEND_URL=http://localhost:3001
PORT=3001
```

### 3. Run the Application

#### Option 1: Run Both Frontend and Backend Together
```bash
npm run dev:full
```

#### Option 2: Run Separately
```bash
# Terminal 1 - Backend
npm run dev:backend

# Terminal 2 - Frontend  
npm run dev
```

The backend will run on `http://localhost:3001` and the frontend on `http://localhost:5173`.

## Architecture

### Backend Proxy Approach (Current)
```
Frontend (Browser) → Backend API → CloudFlare R2
```

**Benefits:**
- ✅ No CORS issues
- ✅ Secure API key handling
- ✅ Better error handling
- ✅ Session retrieval capabilities

### Backend API Endpoints

- **Health Check**: `GET /health`
- **Store Session**: `POST /api/session/store`
- **Get Session**: `GET /api/session/:userAddress/:chainId?`

## Session Data Structure

Sessions are stored in CloudFlare R2 with the following structure:

```
users/{wallet_address_lowercase}/context.json
```

Example session data:
```json
{
  "sessionInfos": {
    "1": {
      "id": 123456,
      "executor": "0x1e8e3a338046913149c84002e22744780200e3be",
      "validator": "0x0000000000000000000000000000000000000001",
      "validUntil": 1234567890,
      "validAfter": 1234567890,
      "preHook": "0x",
      "postHook": "0x",
      "signature": "0x..."
    }
  }
}
```

## Configuration

See `s3-config.md` for detailed configuration instructions including:
- CloudFlare R2 setup
- Environment variables
- Alternative deployment options
- Legacy direct client approach

## Troubleshooting

### Backend Not Starting
- Check if port 3001 is available
- Verify environment variables in `.env` file
- Check backend console for detailed error messages

### Storage Issues
- Verify CloudFlare R2 credentials
- Check backend health: `curl http://localhost:3001/health`
- Ensure bucket `mesh-context` exists

### Wallet Connection Issues
- Ensure you have a compatible wallet (MetaMask, OKX)
- Check if wallet supports EIP-712 typed data signing
- Verify wallet is upgraded with EIP-7702 for session signing

## Development

### Project Structure
```
├── server/           # Backend Express server
│   └── index.js     # Main server file
├── main.js          # Frontend application
├── index.html       # HTML template
├── package.json     # Dependencies and scripts
└── s3-config.md     # Detailed configuration guide
```

### Technologies Used
- **Frontend**: Vanilla JavaScript, Ethers.js v6, Vite
- **Backend**: Node.js, Express, AWS SDK v3
- **Storage**: CloudFlare R2 (S3-compatible)
- **Blockchain**: Ethereum, EIP-7702, EIP-712

## License

MIT 