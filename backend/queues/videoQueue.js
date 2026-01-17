const Queue = require('bull');
const logger = require('../utils/logger');

const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

// Create Queue
const videoQueue = new Queue('video-transcoding', REDIS_URL);

// Event Listeners
videoQueue.on('error', (error) => {
    logger.error('Video Queue System Error:', error);
});

videoQueue.on('completed', (job, result) => {
    logger.info(`Job ${job.id} completed. Result: ${JSON.stringify(result)}`);
});

videoQueue.on('failed', (job, err) => {
    logger.error(`Job ${job.id} failed:`, err);
});

/**
 * Add video transcoding job
 * @param {Object} data - { videoId, inputPath, destinationPath }
 */
const addVideoToQueue = async (data) => {
    try {
        await videoQueue.add(data, {
            attempts: 3,
            backoff: {
                type: 'exponential',
                delay: 5000
            },
            removeOnComplete: true
        });
        logger.info(`Video added to transcoding queue: ${data.videoId}`);
    } catch (error) {
        logger.error('Failed to add video to queue:', error);
        throw error;
    }
};

module.exports = {
    videoQueue,
    addVideoToQueue
};
