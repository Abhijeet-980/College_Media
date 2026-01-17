const mongoose = require('mongoose');

/**
 * Whiteboard Model
 * Stores collaborative canvas state and history
 */
const whiteboardSchema = new mongoose.Schema({
    roomId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    name: {
        type: String,
        default: 'Untitled Whiteboard'
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    collaborators: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    // Canvas elements (shapes, drawings, text)
    elements: [{
        id: { type: String, required: true },
        type: { type: String, enum: ['path', 'rect', 'circle', 'text', 'image'], required: true },
        data: mongoose.Schema.Types.Mixed, // Coordinates, colors, etc.
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        createdAt: { type: Date, default: Date.now },
        version: { type: Number, default: 1 }
    }],
    // Version for conflict resolution (CRDT-lite)
    version: {
        type: Number,
        default: 0
    },
    // Cursor positions of active users
    cursors: [{
        userId: mongoose.Schema.Types.ObjectId,
        x: Number,
        y: Number,
        color: String,
        lastUpdate: Date
    }],
    settings: {
        backgroundColor: { type: String, default: '#ffffff' },
        gridEnabled: { type: Boolean, default: true },
        isPublic: { type: Boolean, default: false }
    },
    lastModified: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Index for fast room lookup
whiteboardSchema.index({ owner: 1, createdAt: -1 });
whiteboardSchema.index({ collaborators: 1 });

module.exports = mongoose.model('Whiteboard', whiteboardSchema);
