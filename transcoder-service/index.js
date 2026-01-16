require('dotenv').config();
const mongoose = require('mongoose');
const Queue = require('bull');
const transcodeWorker = require('./worker');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/college_media';
const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

// Database Connection
mongoose.connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
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
