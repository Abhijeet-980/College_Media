const vault = require('node-vault');
const logger = require('../utils/logger');

const options = {
    apiVersion: 'v1',
    endpoint: process.env.VAULT_ADDR || 'http://127.0.0.1:8200',
    token: process.env.VAULT_TOKEN || 'root'
};

const vaultClient = vault(options);

/**
 * Fetch secrets from Vault
 */
const initSecrets = async () => {
    // Allow skipping vault in local dev if needed
    if (process.env.SKIP_VAULT === 'true') {
        logger.info('Skipping Vault initialization (SKIP_VAULT=true)');
        return;
    }

    try {
        logger.info(`Connecting to Vault at ${options.endpoint}...`);

        // Check Status
        // await vaultClient.health({ standbyok: true });

        // Read Secrets (Assuming KV Engine mounted at secret/)
        // Pattern: secret/data/app/env
        const secretPath = process.env.VAULT_SECRET_PATH || 'secret/data/college-media/backend';

        const response = await vaultClient.read(secretPath);

        // KV Version 2 uses .data.data
        const secrets = response.data.data;

        if (secrets) {
            // Map secrets to environment variables
            if (secrets.mongo_uri) process.env.MONGO_URI = secrets.mongo_uri;
            if (secrets.jwt_secret) process.env.JWT_SECRET = secrets.jwt_secret;
            if (secrets.redis_url) process.env.REDIS_URL = secrets.redis_url;
            if (secrets.meili_master_key) process.env.MEILI_MASTER_KEY = secrets.meili_master_key;

            logger.info('Successfully loaded secrets from Vault into process.env');
        }

    } catch (error) {
        logger.error('Vault Initialization Failed:', error.message);
        if (process.env.NODE_ENV === 'production') {
            throw new Error('Critical: Could not fetch secrets from Vault in Production');
        }
    }
};

module.exports = { initSecrets, vaultClient };
