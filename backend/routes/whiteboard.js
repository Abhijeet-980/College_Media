const express = require('express');
const router = express.Router();
const Whiteboard = require('../models/Whiteboard');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

const JWT_SECRET = process.env.JWT_SECRET || 'college_media_secret_key';

// Auth middleware
const verifyToken = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ success: false, message: 'No token' });
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.userId = decoded.userId;
        next();
    } catch (error) {
        res.status(401).json({ success: false, message: 'Invalid token' });
    }
};

/**
 * @swagger
 * /api/whiteboard:
 *   post:
 *     summary: Create a new whiteboard
 *     tags: [Whiteboard]
 */
router.post('/', verifyToken, async (req, res) => {
    try {
        const { name } = req.body;
        const roomId = uuidv4();

        const board = await Whiteboard.create({
            roomId,
            name: name || 'Untitled Whiteboard',
            owner: req.userId,
            elements: [],
            version: 0
        });

        res.status(201).json({
            success: true,
            data: {
                roomId: board.roomId,
                name: board.name,
                shareUrl: `/whiteboard/${board.roomId}`
            }
        });
    } catch (error) {
        logger.error('Create whiteboard error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * @swagger
 * /api/whiteboard:
 *   get:
 *     summary: List user's whiteboards
 *     tags: [Whiteboard]
 */
router.get('/', verifyToken, async (req, res) => {
    try {
        const boards = await Whiteboard.find({
            $or: [
                { owner: req.userId },
                { collaborators: req.userId }
            ]
        })
            .select('roomId name owner createdAt lastModified settings.isPublic')
            .sort({ lastModified: -1 })
            .populate('owner', 'username profilePicture');

        res.json({ success: true, boards });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * @swagger
 * /api/whiteboard/{roomId}:
 *   get:
 *     summary: Get whiteboard details
 *     tags: [Whiteboard]
 */
router.get('/:roomId', verifyToken, async (req, res) => {
    try {
        const board = await Whiteboard.findOne({ roomId: req.params.roomId })
            .populate('owner', 'username profilePicture')
            .populate('collaborators', 'username profilePicture');

        if (!board) {
            return res.status(404).json({ success: false, message: 'Whiteboard not found' });
        }

        res.json({ success: true, board });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * @swagger
 * /api/whiteboard/{roomId}/export:
 *   get:
 *     summary: Export whiteboard as SVG data
 *     tags: [Whiteboard]
 */
router.get('/:roomId/export', verifyToken, async (req, res) => {
    try {
        const board = await Whiteboard.findOne({ roomId: req.params.roomId });

        if (!board) {
            return res.status(404).json({ success: false, message: 'Whiteboard not found' });
        }

        // Generate SVG from elements
        let svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" style="background:${board.settings.backgroundColor}">`;

        for (const element of board.elements) {
            if (element.type === 'path' && element.data?.path) {
                svgContent += `<path d="${element.data.path}" stroke="${element.data.stroke || '#000'}" stroke-width="${element.data.strokeWidth || 2}" fill="none"/>`;
            } else if (element.type === 'rect' && element.data) {
                svgContent += `<rect x="${element.data.x}" y="${element.data.y}" width="${element.data.width}" height="${element.data.height}" fill="${element.data.fill || 'none'}" stroke="${element.data.stroke || '#000'}"/>`;
            } else if (element.type === 'circle' && element.data) {
                svgContent += `<circle cx="${element.data.cx}" cy="${element.data.cy}" r="${element.data.r}" fill="${element.data.fill || 'none'}" stroke="${element.data.stroke || '#000'}"/>`;
            } else if (element.type === 'text' && element.data) {
                svgContent += `<text x="${element.data.x}" y="${element.data.y}" fill="${element.data.fill || '#000'}" font-size="${element.data.fontSize || 16}">${element.data.text}</text>`;
            }
        }

        svgContent += '</svg>';

        res.setHeader('Content-Type', 'image/svg+xml');
        res.setHeader('Content-Disposition', `attachment; filename="${board.name}.svg"`);
        res.send(svgContent);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * @swagger
 * /api/whiteboard/{roomId}/collaborators:
 *   post:
 *     summary: Add collaborator to whiteboard
 *     tags: [Whiteboard]
 */
router.post('/:roomId/collaborators', verifyToken, async (req, res) => {
    try {
        const { userId } = req.body;

        const board = await Whiteboard.findOneAndUpdate(
            { roomId: req.params.roomId, owner: req.userId },
            { $addToSet: { collaborators: userId } },
            { new: true }
        );

        if (!board) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        res.json({ success: true, message: 'Collaborator added' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * @swagger
 * /api/whiteboard/{roomId}:
 *   delete:
 *     summary: Delete a whiteboard
 *     tags: [Whiteboard]
 */
router.delete('/:roomId', verifyToken, async (req, res) => {
    try {
        const result = await Whiteboard.deleteOne({
            roomId: req.params.roomId,
            owner: req.userId
        });

        if (result.deletedCount === 0) {
            return res.status(403).json({ success: false, message: 'Not authorized or not found' });
        }

        res.json({ success: true, message: 'Whiteboard deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
