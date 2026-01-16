import React from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { useNotifications } from '../context/NotificationContext';
import { formatDistanceToNow } from 'date-fns';
import { Notification } from '../types';

interface NotificationItemProps {
  notification: Notification;
  onClick?: () => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({ notification, onClick }) => {
  const { markAsRead } = useNotifications();

  const handleClick = async () => {
    if (!notification.isRead) {
      await markAsRead(notification._id);
    }
    if (onClick) onClick();
  };

  const getNotificationIcon = (type: string) => {
    const icons: Record<string, { icon: string; color: string }> = {
      like: { icon: 'mdi:heart', color: 'text-red-500' },
      comment: { icon: 'mdi:comment', color: 'text-blue-500' },
      follow: { icon: 'mdi:account-plus', color: 'text-green-500' },
      mention: { icon: 'mdi:at', color: 'text-purple-500' },
      message: { icon: 'mdi:message-text', color: 'text-indigo-500' },
      share: { icon: 'mdi:share-variant', color: 'text-orange-500' },
      reply: { icon: 'mdi:reply', color: 'text-indigo-500' },
    };
    return icons[type] || { icon: 'mdi:bell', color: 'text-text-muted' };
  };

  const sender = notification.sender || notification.actor;
  const username = sender?.username || 'Someone';
  const profilePicture = sender?.profilePicture || (sender as any)?.avatar;
  const iconData = getNotificationIcon(notification.type);

  const getNotificationMessage = () => {
    if (notification.content) return notification.content;
    if (notification.message) return notification.message;

    switch (notification.type) {
      case 'like': return 'liked your post';
      case 'comment': return 'commented on your post';
      case 'follow': return 'started following you';
      case 'mention': return 'mentioned you in a post';
      case 'message': return 'sent you a message';
      default: return 'sent you a notification';
    }
  };

  const link = notification.post ? `/post/${notification.post._id || (notification.post as any).id}` : '#';

  return (
    <Link
      to={link}
      onClick={handleClick}
      className={`block px-4 py-4 hover:bg-bg-tertiary transition-colors border-l-4 ${!notification.isRead ? 'bg-brand-primary/5 border-brand-primary' : 'border-transparent'
        }`}
    >
      <div className="flex items-start gap-3">
        {/* User Avatar or Icon */}
        <div className="flex-shrink-0 relative">
          {profilePicture ? (
            <img
              src={profilePicture}
              alt={username}
              className="w-12 h-12 rounded-full object-cover border border-border"
            />
          ) : (
            <div className={`w-12 h-12 rounded-full bg-bg-secondary flex items-center justify-center border border-border ${iconData.color}`}>
              <Icon icon={iconData.icon} width={24} />
            </div>
          )}
          <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-white dark:bg-bg-secondary flex items-center justify-center shadow-sm border border-border ${iconData.color}`}>
            <Icon icon={iconData.icon} width={14} />
          </div>
        </div>

        {/* Notification Content */}
        <div className="flex-1 min-w-0">
          <p className="text-sm text-text-primary leading-snug">
            <span className="font-bold">{username}</span>{' '}
            <span className="text-text-secondary">
              {getNotificationMessage()}
            </span>
          </p>

          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-xs text-text-muted font-medium">
              {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
            </span>

            {!notification.isRead && (
              <span className="w-1.5 h-1.5 bg-brand-primary rounded-full"></span>
            )}
          </div>
        </div>

        {/* Post Preview */}
        {notification.post?.imageUrl && (
          <div className="flex-shrink-0 w-14 h-14 ml-2">
            <img
              src={notification.post.imageUrl}
              alt="Post Preview"
              className="w-full h-full object-cover rounded-lg border border-border"
            />
          </div>
        )}
      </div>
    </Link>
  );
};

export default NotificationItem;
