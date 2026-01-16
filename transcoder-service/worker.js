const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');

/**
 * Worker function to process video transcoding
 * @param {Object} data - { videoId, inputPath }
 */
module.exports = async (data) => {
    const { videoId, inputPath } = data;

    // Verify input
    if (!fs.existsSync(inputPath)) {
        throw new Error(`Input file missing: ${inputPath}`);
    }

    const outputDir = path.dirname(inputPath);
    const baseName = path.basename(inputPath, path.extname(inputPath));

    // Define Outputs
    const output720 = path.join(outputDir, `${baseName}_720p.mp4`);
    const output480 = path.join(outputDir, `${baseName}_480p.mp4`);

    console.log(`Worker: Processing ${videoId} (${baseName})`);

    // 1. Update Status: Processing
    await mongoose.connection.collection('posts').updateOne(
        { _id: new mongoose.Types.ObjectId(videoId) },
        { $set: { transcodingStatus: 'processing' } }
    );

    try {
        // 2. Transcode 720p
        await transcode(inputPath, output720, '1280x720');

        // 3. Transcode 480p
        await transcode(inputPath, output480, '854x480');

        // 4. Update Status: Completed
        // In a real system, we'd upload these to S3/Cloudinary and save the URLs
        // Here we save local paths relative to the uploads root (simplification)

        await mongoose.connection.collection('posts').updateOne(
            { _id: new mongoose.Types.ObjectId(videoId) },
            {
                $set: {
                    transcodingStatus: 'completed',
                    variants: {
                        '720p': `/uploads/${path.basename(output720)}`,
                        '480p': `/uploads/${path.basename(output480)}`
                    }
                }
            }
        );

        return { success: true };

    } catch (error) {
        console.error('Transcoding Error:', error);

        await mongoose.connection.collection('posts').updateOne(
            { _id: new mongoose.Types.ObjectId(videoId) },
            { $set: { transcodingStatus: 'failed' } }
        );
        throw error;
    }
};

// Helper Wrapper for FFmpeg
function transcode(input, output, size) {
    return new Promise((resolve, reject) => {
        ffmpeg(input)
            .output(output)
            .size(size)
            .videoCodec('libx264')
            .on('end', () => {
                console.log(`Converted to ${size}`);
                resolve(output);
            })
            .on('error', (err) => reject(err))
            .run();
    });
}
