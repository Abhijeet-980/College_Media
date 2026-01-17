require('dotenv').config();
const mongoose = require('mongoose');
const Queue = require('bull');
const transcodeWorker = require('./worker');
const https = require('https');
const { getTLSConfig } = require('./config/tls');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/college_media';
const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

// Database Connection
mongoose.connect(MONGO_URI).then(() => {
    console.log('🎬 Transcoder Service: DB Connected');
}).catch(err => {
    console.error('DB Connection Failed:', err);
    process.exit(1);
});

// Redis Queue Connection
const videoQueue = new Queue('video-transcoding', REDIS_URL);

console.log('🎬 Transcoder Service: Waiting for jobs...');

// Process Jobs with Concurrency of 2
videoQueue.process(2, async (job) => {
    console.log(`Starting Job ${job.id}: Video ${job.data.videoId}`);
    try {
        const result = await transcodeWorker(job.data);
        console.log(`Job ${job.id} Completed.`);
        return result;
    } catch (error) {
        console.error(`Job ${job.id} Failed:`, error);
        throw error;
    }
});

// Secure Control Plane (mTLS)
const tlsOptions = getTLSConfig();
if (tlsOptions) {
    const server = https.createServer(tlsOptions, (req, res) => {
        const cert = req.socket.getPeerCertificate();
        if (req.client.authorized) {
            res.writeHead(200);
            res.end(`Secure Connection Verified. Client CN: ${cert.subject.CN}`);
        } else {
            // Should be handled by rejectUnauthorized: true, but extra safety
            res.writeHead(401);
            res.end("Unauthorized");
        }
    });

    server.listen(8443, () => {
        console.log('🔒 Secure Control Plane listening on 8443 (mTLS Enforced)');
    });
} else {
    console.log('⚠️ mTLS Certificates not found. Secure Control Plane disabled.');
}
