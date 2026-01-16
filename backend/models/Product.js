const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    seller: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },
    description: {
        type: String,
        required: true,
        maxlength: 2000
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    currency: {
        type: String,
        default: 'INR'
    },
    images: [{
        type: String // URLs
    }],
    category: {
        type: String,
        enum: ['books', 'electronics', 'furniture', 'clothing', 'other'],
        required: true
    },
    condition: {
        type: String,
        enum: ['new', 'like_new', 'good', 'fair', 'poor'],
        required: true
    },
    status: {
        type: String,
        enum: ['active', 'sold', 'archived'],
        default: 'active',
        index: true
    },
    location: {
        city: String,
        campus: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Text index for search
productSchema.index({ title: 'text', description: 'text' });

module.exports = mongoose.model('Product', productSchema);
