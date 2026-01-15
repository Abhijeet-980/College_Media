const Whiteboard = require('../models/Whiteboard');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

const JWT_SECRET = process.env.JWT_SECRET || 'college_media_secret_key';

/**
 * Initialize Whiteboard Socket Handlers
 * @param {SocketIO.Server} io - Socket.io server instance
 */
function initWhiteboardSockets(io) {
    const whiteboardNamespace = io.of('/whiteboard');

    // Authentication middleware
    whiteboardNamespace.use((socket, next) => {
        const token = socket.handshake.auth.token;
        if (!token) return next(new Error('Authentication required'));

        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            socket.userId = decoded.userId;
            socket.username = decoded.username || 'Anonymous';
            next();
        } catch (err) {
            next(new Error('Invalid token'));
        }
    });

    whiteboardNamespace.on('connection', (socket) => {
        logger.info(`Whiteboard: User ${socket.userId} connected`);

        // Join a whiteboard room
        socket.on('join-room', async (roomId) => {
            try {
                let board = await Whiteboard.findOne({ roomId });

                if (!board) {
                    // Create new board
                    board = await Whiteboard.create({
                        roomId,
                        owner: socket.userId,
                        elements: [],
                        version: 0
                    });
                }

                socket.join(roomId);
                socket.roomId = roomId;

                // Send current state to joining user
                socket.emit('board-state', {
                    elements: board.elements,
                    version: board.version,
                    settings: board.settings
                });

                // Notify others
                socket.to(roomId).emit('user-joined', {
                    userId: socket.userId,
                    username: socket.username
                });

                logger.info(`User ${socket.userId} joined room ${roomId}`);
            } catch (error) {
                logger.error('Join room error:', error);
                socket.emit('error', { message: 'Failed to join room' });
            }
        });

        // Handle drawing operations
        socket.on('draw', async (data) => {
            try {
                const { roomId, element, action } = data;

                // Broadcast to other users immediately (optimistic update)
                socket.to(roomId).emit('draw', {
                    element,
                    action,
                    userId: socket.userId
                });

                // Persist to database (batched/debounced in production)
                if (action === 'add') {
                    await Whiteboard.updateOne(
                        { roomId },
                        {
                            $push: { elements: { ...element, createdBy: socket.userId } },
                            $inc: { version: 1 },
                            $set: { lastModified: new Date() }
                        }
                    );
                } else if (action === 'update') {
                    await Whiteboard.updateOne(
                        { roomId, 'elements.id': element.id },
                        {
                            $set: { 'elements.$': element },
                            $inc: { version: 1 },
                            $set: { lastModified: new Date() }
                        }
                    );
                } else if (action === 'delete') {
                    await Whiteboard.updateOne(
                        { roomId },
                        {
                            $pull: { elements: { id: element.id } },
                            $inc: { version: 1 },
                            $set: { lastModified: new Date() }
                        }
                    );
                }
            } catch (error) {
                logger.error('Draw operation error:', error);
            }
        });

        // Cursor movement (for showing collaborator cursors)
        socket.on('cursor-move', (data) => {
            socket.to(socket.roomId).emit('cursor-move', {
                userId: socket.userId,
                username: socket.username,
                x: data.x,
                y: data.y,
                color: data.color || '#3b82f6'
            });
        });

        // Clear board
        socket.on('clear-board', async () => {
            try {
                await Whiteboard.updateOne(
                    { roomId: socket.roomId },
                    {
                        $set: { elements: [], lastModified: new Date() },
                        $inc: { version: 1 }
                    }
                );
                whiteboardNamespace.to(socket.roomId).emit('board-cleared');
            } catch (error) {
                logger.error('Clear board error:', error);
            }
        });

        // Undo (simplified - last element by user)
        socket.on('undo', async () => {
            try {
                const board = await Whiteboard.findOne({ roomId: socket.roomId });
                if (!board) return;

                // Find last element by this user
                const userElements = board.elements.filter(e =>
                    e.createdBy?.toString() === socket.userId
                );

                if (userElements.length > 0) {
                    const lastElement = userElements[userElements.length - 1];
                    await Whiteboard.updateOne(
                        { roomId: socket.roomId },
                        { $pull: { elements: { id: lastElement.id } } }
                    );
                    whiteboardNamespace.to(socket.roomId).emit('draw', {
                        element: lastElement,
                        action: 'delete',
                        userId: socket.userId
                    });
                }
            } catch (error) {
                logger.error('Undo error:', error);
            }
        });

        // Disconnect
        socket.on('disconnect', () => {
            if (socket.roomId) {
                socket.to(socket.roomId).emit('user-left', {
                    userId: socket.userId,
                    username: socket.username
                });
            }
            logger.info(`Whiteboard: User ${socket.userId} disconnected`);
        });
    });

    return whiteboardNamespace;
}

module.exports = initWhiteboardSockets;
