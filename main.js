import { ethers } from 'ethers';

let provider = null;
let signer = null;
let userAddress = null;

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
        
        // Construct EIP-712 typed data payload
        
        // Domain separator
        const domain = {
            name: 'Executor',
            version: '1',
            chainId: 1n, // Ethereum Mainnet (using BigInt in v6)
            verifyingContract: '0x000000000000000000000000000000000000dEaD' // Placeholder - replace with actual executor contract address
        };
        
        // Type definitions for the Session struct
        const types = {
            Session: [
                { name: 'signer', type: 'address' },
                { name: 'executor', type: 'address' },
                { name: 'nonce', type: 'uint256' },
                { name: 'deadline', type: 'uint256' }
            ]
        };
        
        // Generate secure random nonce
        const randomBytes = ethers.randomBytes(32);
        const nonce = ethers.toBigInt(randomBytes);
        
        // Set deadline to 1 hour from now
        const currentTimestamp = Math.floor(Date.now() / 1000);
        const deadline = BigInt(currentTimestamp + 3600); // 1 hour in seconds
        
        // Value to sign (session object)
        const session = {
            signer: userAddress,
            executor: domain.verifyingContract,
            nonce: nonce.toString(),
            deadline: deadline.toString()
        };
        
        // Request signature from wallet using v6 syntax
        const signature = await signer.signTypedData(domain, types, session);
        
        // Display signature
        document.getElementById('signatureArea').classList.remove('hidden');
        document.getElementById('signatureText').textContent = signature;
        
        showMessage('Session data signed successfully!');
        
    } catch (error) {
        console.error('Signing error:', error);
        if (error.code === 4001) {
            showMessage('User rejected the signing request.', true);
        } else {
            showMessage(`Signing failed: ${error.message}`, true);
        }
    }
}

// Add event listeners when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('connectButton').addEventListener('click', connectWallet);
    document.getElementById('signButton').addEventListener('click', signSessionData);
});