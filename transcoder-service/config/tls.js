const fs = require('fs');
const path = require('path');

const CERTS_DIR = process.env.CERTS_DIR || path.join(__dirname, '../../certs');

/**
 * Load TLS Configuration for mTLS
 * Requires: server.key, server.crt, and ca.crt
 */
const getTLSConfig = () => {
    try {
        // Check if files exist
        const keyPath = path.join(CERTS_DIR, 'server.key');
        const certPath = path.join(CERTS_DIR, 'server.crt');
        const caPath = path.join(CERTS_DIR, 'ca.crt');

        if (!fs.existsSync(keyPath) || !fs.existsSync(certPath) || !fs.existsSync(caPath)) {
            console.warn('TLS Certificates not found. Skipping mTLS setup.');
            return null;
        }

        return {
            key: fs.readFileSync(keyPath),
            cert: fs.readFileSync(certPath),
            // This is necessary only if the client uses a self-signed cert
            ca: [fs.readFileSync(caPath)],

            // Request client certificate from connecting party
            requestCert: true,

            // REJECT any connection that doesnt provide a valid cert signed by our CA
            rejectUnauthorized: true
        };
    } catch (error) {
        console.error('Error loading TLS config:', error);
        return null;
    }
};

module.exports = { getTLSConfig };
