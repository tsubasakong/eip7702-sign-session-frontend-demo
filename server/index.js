import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000'],
    credentials: true
}));
app.use(express.json());

// S3 Configuration
const S3_CONFIG = {
    bucket: 'mesh-context',
    accessKeyId: process.env.VITE_S3_ACCESS_KEY,
    secretAccessKey: process.env.VITE_S3_SECRET_KEY,
    endpoint: process.env.VITE_S3_ENDPOINT,
    region: process.env.VITE_S3_REGION || 'auto'
};

// Initialize S3 client
let s3Client = null;

function initializeS3Client() {
    if (!S3_CONFIG.accessKeyId || !S3_CONFIG.secretAccessKey || !S3_CONFIG.endpoint) {
        console.error('S3 configuration incomplete. Please check your environment variables.');
        return null;
    }
    
    try {
        s3Client = new S3Client({
            credentials: {
                accessKeyId: S3_CONFIG.accessKeyId,
                secretAccessKey: S3_CONFIG.secretAccessKey,
            },
            endpoint: S3_CONFIG.endpoint,
            region: S3_CONFIG.region,
            forcePathStyle: true, // Required for Cloudflare R2
        });
        console.log(`✅ S3 client initialized with bucket ${S3_CONFIG.bucket}`);
        return s3Client;
    } catch (error) {
        console.error('❌ Failed to initialize S3 client:', error);
        return null;
    }
}

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        s3Connected: !!s3Client
    });
});

// Store session data endpoint
app.post('/api/session/store', async (req, res) => {
    try {
        const { userAddress, chainId, sessionData } = req.body;

        if (!userAddress || !chainId || !sessionData) {
            return res.status(400).json({
                error: 'Missing required fields: userAddress, chainId, sessionData'
            });
        }

        if (!s3Client) {
            return res.status(500).json({
                error: 'S3 client not initialized. Check server configuration.'
            });
        }

        const userId = userAddress.toLowerCase();
        const chainIdStr = chainId.toString();
        
        // Create session info object matching the Python structure
        const sessionInfo = {
            id: sessionData.id,
            executor: sessionData.executor,
            validator: sessionData.validator,
            validUntil: sessionData.validUntil,
            validAfter: sessionData.validAfter,
            preHook: sessionData.preHook,
            postHook: sessionData.postHook,
            signature: sessionData.signature
        };
        
        // Get existing user context or create new one
        let userContext = {
            sessionInfos: {}
        };
        
        const contextKey = `${userId.replace(/[/\\]/g, "_")}.json`;
        
        // Try to get existing context first
        try {
            const getCommand = new GetObjectCommand({
                Bucket: S3_CONFIG.bucket,
                Key: contextKey
            });
            
            const response = await s3Client.send(getCommand);
            const bodyText = await response.Body.transformToString();
            userContext = JSON.parse(bodyText);
            console.log(`userContext: ${JSON.stringify(userContext, null, 2)}`);
            
            console.log(`📄 Retrieved existing context for user ${userId}`);
        } catch (getError) {
            // If context doesn't exist, we'll use the empty one created above
            console.log(`📄 Creating new context for user ${userId}`);
        }
        
        // Add or update session info for this chain
        if (!userContext.sessionInfos) {
            userContext.sessionInfos = {};
        }
        userContext.sessionInfos[chainIdStr] = sessionInfo;
        
        // Store the updated context in S3
        const putCommand = new PutObjectCommand({
            Bucket: S3_CONFIG.bucket,
            Key: contextKey,
            Body: JSON.stringify(userContext, null, 2),
            ContentType: 'application/json'
        });
        
        await s3Client.send(putCommand);
        
        console.log(`✅ Session data stored successfully for user ${userId} on chain ${chainId}`);
        
        res.json({
            success: true,
            message: `Session data stored successfully for user ${userId} on chain ${chainId}`,
            data: {
                userId,
                chainId: chainIdStr,
                sessionId: sessionInfo.id
            }
        });
        
    } catch (error) {
        console.error('❌ Failed to store session data:', error);
        res.status(500).json({
            error: 'Failed to store session data',
            details: error.message
        });
    }
});

// Get session data endpoint
app.get('/api/session/:userAddress/:chainId?', async (req, res) => {
    try {
        const { userAddress, chainId } = req.params;
        
        if (!s3Client) {
            return res.status(500).json({
                error: 'S3 client not initialized. Check server configuration.'
            });
        }

        const userId = userAddress.toLowerCase();
        const contextKey = `${userId.replace(/[/\\]/g, "_")}.json`;
        
        try {
            const command = new GetObjectCommand({
                Bucket: S3_CONFIG.bucket,
                Key: contextKey
            });
            
            const response = await s3Client.send(command);
            const bodyText = await response.Body.transformToString();
            const userContext = JSON.parse(bodyText);
            
            if (chainId) {
                // Return session data for specific chain
                const sessionData = userContext.sessionInfos?.[chainId];
                if (!sessionData) {
                    return res.status(404).json({
                        error: `No session data found for user ${userId} on chain ${chainId}`
                    });
                }
                
                res.json({
                    success: true,
                    data: sessionData
                });
            } else {
                // Return all session data for user
                res.json({
                    success: true,
                    data: userContext
                });
            }
            
        } catch (getError) {
            if (getError.name === 'NoSuchKey') {
                return res.status(404).json({
                    error: `No session data found for user ${userId}`
                });
            }
            throw getError;
        }
        
    } catch (error) {
        console.error('❌ Failed to retrieve session data:', error);
        res.status(500).json({
            error: 'Failed to retrieve session data',
            details: error.message
        });
    }
});

// Initialize S3 client and start server
initializeS3Client();

app.listen(PORT, () => {
    console.log(`🚀 Backend server running on http://localhost:${PORT}`);
    console.log(`📍 Health check: http://localhost:${PORT}/health`);
    console.log(`📊 Session storage: POST http://localhost:${PORT}/api/session/store`);
    console.log(`📖 Session retrieval: GET http://localhost:${PORT}/api/session/:userAddress/:chainId?`);
    
    if (!s3Client) {
        console.log('⚠️  Warning: S3 client not initialized. Check your environment variables.');
    }
}); 