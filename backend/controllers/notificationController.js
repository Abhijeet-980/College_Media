const Notification = require('../models/Notification');

exports.getNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({ recipient: req.user._id })
            .populate('sender', 'username profilePicture')
            .populate('post', 'caption imageUrl')
            .sort({ createdAt: -1 })
            .limit(50);
        res.json(notifications);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.markAsRead = async (req, res) => {
    try {
        const notification = await Notification.findOneAndUpdate(
            { _id: req.params.id, recipient: req.user._id },
            { isRead: true },
            { new: true }
        );
        res.json(notification);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.markAllAsRead = async (req, res) => {
    try {
        await Notification.updateMany(
            { recipient: req.user._id },
            { isRead: true }
        );
        res.json({ message: 'All notifications marked as read' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.createNotification = async (data) => {
    try {
        const notification = new Notification(data);
        await notification.save();
        return await notification.populate('sender', 'username profilePicture').execPopulate();
    } catch (error) {
        console.error('Error creating notification:', error);
    }
};
