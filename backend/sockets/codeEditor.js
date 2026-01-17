const CodeExecutionService = require('../services/codeExecution');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

const JWT_SECRET = process.env.JWT_SECRET || 'college_media_secret_key';

// Store room state in memory (for simplicity)
// In production, use Redis
const roomState = new Map();

function initCodeEditorSockets(io) {
    const editorNamespace = io.of('/code-editor');

    // Auth middleware
    editorNamespace.use((socket, next) => {
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

    editorNamespace.on('connection', (socket) => {
        logger.info(`CodeEditor: User ${socket.userId} connected`);

        socket.on('join-room', (roomId) => {
            socket.join(roomId);
            socket.roomId = roomId;

            // Initialize room if not exists
            if (!roomState.has(roomId)) {
                roomState.set(roomId, {
                    code: '// Start coding here...',
                    language: 'javascript',
                    users: new Set()
                });
            }

            const room = roomState.get(roomId);
            room.users.add({ socketId: socket.id, username: socket.username, userId: socket.userId });

            // Send current state
            socket.emit('init-state', {
                code: room.code,
                language: room.language,
                users: Array.from(room.users)
            });

            // Notify others
            socket.to(roomId).emit('user-joined', {
                socketId: socket.id,
                username: socket.username,
                userId: socket.userId
            });
        });

        // Sync Code Changes
        socket.on('code-change', (data) => {
            const { roomId, code } = data;

            // Update server state
            if (roomState.has(roomId)) {
                roomState.get(roomId).code = code;
            }

            // Broadcast to others (exclude sender)
            socket.to(roomId).emit('code-change', { code });
        });

        // Sync Cursor/Selection
        socket.on('cursor-change', (data) => {
            const { roomId, cursor } = data;
            socket.to(roomId).emit('cursor-change', {
                socketId: socket.id,
                username: socket.username,
                cursor
            });
        });

        // Language Change
        socket.on('language-change', (data) => {
            const { roomId, language } = data;
            if (roomState.has(roomId)) {
                roomState.get(roomId).language = language;
            }
            socket.to(roomId).emit('language-change', { language });
        });

        // Run Code
        socket.on('run-code', async (data) => {
            const { roomId, code, language } = data;

            // Notify everyone execution started
            editorNamespace.to(roomId).emit('execution-start');

            try {
                const result = await CodeExecutionService.execute(language, code);
                editorNamespace.to(roomId).emit('execution-result', result);
            } catch (error) {
                editorNamespace.to(roomId).emit('execution-error', { error: error.message });
            }
        });

        socket.on('disconnect', () => {
            if (socket.roomId && roomState.has(socket.roomId)) {
                const room = roomState.get(socket.roomId);
                // Remove user
                room.users = new Set(Array.from(room.users).filter(u => u.socketId !== socket.id));

                socket.to(socket.roomId).emit('user-left', {
                    socketId: socket.id,
                    username: socket.username
                });

                // Cleanup empty rooms after timeout
                if (room.users.size === 0) {
                    setTimeout(() => {
                        if (roomState.has(socket.roomId) && roomState.get(socket.roomId).users.size === 0) {
                            roomState.delete(socket.roomId);
                        }
                    }, 300000); // 5 mins
                }
            }
        });
    });

    return editorNamespace;
}

module.exports = initCodeEditorSockets;
