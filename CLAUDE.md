Project Brief: EIP-7702 Session Signing Web Demo
1. Objective
Create a single, self-contained index.html file that serves as a simple web-based demonstration for signing an EIP-7702 session key using a browser wallet like OKX Wallet or MetaMask.

The demo should connect to the Ethereum Mainnet, check if the user's account is EIP-7702 ready (i.e., has code), and allow the user to sign a structured EIP-712 typed data message that represents a "Session."

2. Core Technologies
HTML: For the basic structure of the page.

Tailwind CSS: For modern and clean styling. Load it via the official CDN.

Ethers.js: For all blockchain interactions (connecting to the wallet, signing messages). Load the UMD version (v5) from a CDN.

3. UI/UX Requirements
The user interface should be clean, intuitive, and centered on the page. It must contain the following elements:

Title: A clear heading like "EIP-7702 Session Signing Demo".

Connection Status Area:

Initially, it should display a message like "Please connect your wallet."

After a successful connection, it should show "Wallet Connected!" and the user's full Ethereum address below it.

EIP-7702 Status: A new line in this area should display the compatibility status, e.g., "EIP-7702 Status: Ready (Account has code)" or "EIP-7702 Status: Standard EOA (No code detected)".

Action Buttons:

"Connect Wallet" Button: This button initiates the connection to the user's browser wallet. It should become disabled and change its text to "Connected" after a successful connection.

"Sign Session Data" Button: This button should be disabled by default. It becomes active only after the wallet is successfully connected. Clicking it will trigger the signing process.

Signature Display Area:

This area should be hidden by default.

After the user successfully signs the message, this area should become visible and display the full, generated signature string.

Message/Notification Box:

A non-intrusive element (e.g., a styled div) to display success messages (e.g., "Session data signed successfully!") or error messages (e.g., "User rejected the request."). The message should disappear after a few seconds. Do not use alert().

4. Functional Requirements (The Logic)
The JavaScript code within the <script> tag must perform the following actions:

Wallet Connection (connectWallet function):

Check if window.ethereum is available. If not, show an error message.

Instantiate an ethers.providers.Web3Provider.

Request account access using provider.send("eth_requestAccounts", []).

Get the signer object and the user's address.

Check for EIP-7702 Compatibility:

After getting the user's address, use provider.getCode(userAddress) to check for existing bytecode.

If the result is anything other than '0x', it signifies the account is already a smart contract or has been upgraded via a standard like EIP-7702.

Update the "EIP-7702 Status" UI element based on this check.

Update the rest of the UI to reflect the connected state.

Handle any errors that occur during the connection process.

Session Data Signing (signSessionData function):

This function should be called when the "Sign Session Data" button is clicked.

Crucially, it must construct an EIP-712 typed data payload.

Domain Separator (domain):

name: 'Executor'

version: '1'

chainId: 1 (Hardcode for Ethereum Mainnet).

verifyingContract: The address of the executor contract. Use a placeholder address like 0x000000000000000000000000000000000000dEaD for this demo, and add a comment indicating it should be replaced.

Type Definitions (types):

Define the Session struct with the exact field names and types:

signer: address

executor: address

nonce: uint256

deadline: uint256

Value to Sign (session object):

signer: The connected user's address.

executor: The same placeholder address used in the domain.

nonce: A secure random uint256 value (e.g., ethers.BigNumber.from(ethers.utils.randomBytes(32))).

deadline: A future timestamp (e.g., 1 hour from the current time).

Signing:

Use the signer._signTypedData(domain, types, session) method to request the signature from the user's wallet.

UI Update:

On success, display the returned signature in the designated area.

On failure (e.g., user rejects), show an appropriate error message.

5. Final Output
The final deliverable must be a single, complete index.html file. All CSS (via CDN) and JavaScript must be included within this file. The code should be well-commented, especially the EIP-712 and EIP-7702 check sections, to explain their purpose.