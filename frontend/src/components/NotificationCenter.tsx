import { useState, useEffect, useMemo } from 'react';
import { Icon } from '@iconify/react';
import { useTranslation } from 'react-i18next';
import { useNotifications } from '../context/NotificationContext';
import NotificationItem from './NotificationItem';
import { toast } from 'react-hot-toast';

const NotificationCenter = () => {
  const { t } = useTranslation();
  const {
    notifications: contextNotifications,
    unreadCount,
    markAllAsRead,
    clearAll,
    loading: contextLoading
  } = useNotifications();

  const [filter, setFilter] = useState('all');

  const filteredNotifications = useMemo(() => {
    if (filter === 'all') return contextNotifications;
    return contextNotifications.filter(n => n.type === filter);
  }, [filter, contextNotifications]);

  const filters = useMemo(() => [
    { value: 'all', label: t('notifications.filters.all') || 'All', icon: 'mdi:bell' },
    { value: 'like', label: t('notifications.filters.like') || 'Likes', icon: 'mdi:heart' },
    { value: 'comment', label: t('notifications.filters.comment') || 'Comments', icon: 'mdi:comment' },
    { value: 'follow', label: t('notifications.filters.follow') || 'Follows', icon: 'mdi:account-plus' },
    { value: 'mention', label: t('notifications.filters.mention') || 'Mentions', icon: 'mdi:at' },
  ], [t]);

  return (
    <div className="min-h-screen bg-bg-primary py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-bg-secondary rounded-2xl shadow-soft border border-border p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-brand-primary/10 rounded-xl text-brand-primary">
                <Icon icon="mdi:bell" width={24} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-text-primary">
                  {t('notifications.title') || 'Notifications'}
                </h1>
                <p className="text-text-muted text-sm">
                  {unreadCount > 0 ? `You have ${unreadCount} unread notifications` : 'No new notifications'}
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="px-4 py-2 text-xs font-bold text-brand-primary hover:bg-brand-primary/10 rounded-lg transition-all"
                >
                  Mark all as read
                </button>
              )}
              {contextNotifications.length > 0 && (
                <button
                  onClick={() => {
                    if (window.confirm('Clear all notifications?')) {
                      clearAll();
                    }
                  }}
                  className="p-2 text-text-muted hover:text-red-500 rounded-lg transition-colors"
                  title="Clear all"
                >
                  <Icon icon="mdi:trash-can-outline" width={20} />
                </button>
              )}
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {filters.map((f) => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all ${filter === f.value
                  ? 'bg-brand-primary text-white shadow-md shadow-brand-primary/20'
                  : 'bg-bg-tertiary text-text-secondary hover:bg-bg-primary'
                  }`}
              >
                <Icon icon={f.icon} width={16} />
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Notifications List */}
        <div className="bg-bg-secondary rounded-2xl shadow-soft border border-border overflow-hidden">
          {contextLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Icon icon="mdi:loading" width={40} className="animate-spin text-brand-primary" />
              <p className="text-text-muted animate-pulse">Loading notifications...</p>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
              <div className="w-20 h-20 bg-bg-tertiary rounded-full flex items-center justify-center mb-4">
                <Icon
                  icon="mdi:bell-off-outline"
                  width={40}
                  className="text-text-muted"
                />
              </div>
              <h3 className="text-xl font-bold text-text-primary mb-2">
                All caught up!
              </h3>
              <p className="text-text-muted max-w-sm">
                {filter === 'all'
                  ? "You don't have any notifications at the moment."
                  : `You don't have any ${filter} notifications.`}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filteredNotifications.map((notification) => (
                <NotificationItem
                  key={notification._id}
                  notification={notification}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationCenter;
