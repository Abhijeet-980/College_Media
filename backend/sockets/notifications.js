/**
 * Real-time Notifications Socket Handler
 */
const NotificationService = require('../services/notificationService');

module.exports = (io) => {
    NotificationService.init(io);

    // We rely on the default namespace for general notifications
    io.on('connection', (socket) => {
        // Users join a room named after their userId for targeted emits
        socket.on('join_notifications', (userId) => {
            socket.join(userId.toString());
            console.log(`Socket ${socket.id} joined notification room: ${userId}`);
        });
    });
};
