import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { useSocket } from "./SocketContext";
import { notificationsApi } from "../api/endpoints";
import { playNotificationSound } from "../utils/notificationSound";
import { toast } from "react-hot-toast";
import { Notification as INotification } from "../types";

interface NotificationContextType {
  notifications: INotification[];
  unreadCount: number;
  loading: boolean;
  preferences: NotificationPreferences;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  clearAll: () => Promise<void>;
  updatePreferences: (prefs: Partial<NotificationPreferences>) => void;
  refreshNotifications: () => Promise<void>;
}

interface NotificationPreferences {
  soundEnabled: boolean;
  desktopEnabled: boolean;
  doNotDisturb: boolean;
  types: Record<string, boolean>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotifications must be used within NotificationProvider"
    );
  }
  return context;
};

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<INotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    soundEnabled: true,
    desktopEnabled: true,
    doNotDisturb: false,
    types: {
      like: true,
      comment: true,
      follow: true,
      mention: true,
      share: true,
      reply: true,
    },
  });
  const { socket } = useSocket();

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const res = await notificationsApi.getAll();
      setNotifications(res.data || []);
      const unread = (res.data || []).filter((n: INotification) => !n.isRead).length;
      setUnreadCount(unread);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    if (!socket) return;

    // Join room for the current user
    // We assume the socket initialization handles auth, but we might need to join a specific room
    // The SocketContext already sends userId in auth, and our backend joins the room automatically if initialized correctly.

    const handleNewNotification = (notification: INotification) => {
      if (!preferences.types[notification.type] || preferences.doNotDisturb) return;

      setNotifications((prev) => [notification, ...prev]);
      setUnreadCount((prev) => prev + 1);

      if (preferences.soundEnabled) {
        playNotificationSound();
      }

      toast.success(`${notification.sender.username} ${notification.type === 'like' ? 'liked your post' : 'sent a notification'}`, {
        duration: 4000
      });
    };

    socket.on("notification", handleNewNotification);

    return () => {
      socket.off("notification", handleNewNotification);
    };
  }, [socket, preferences]);

  const markAsRead = useCallback(async (id: string) => {
    try {
      await notificationsApi.markAsRead(id);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      toast.error("Failed to update notification");
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await notificationsApi.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      toast.error("Failed to update notifications");
    }
  }, []);

  const deleteNotification = useCallback(async (id: string) => {
    // API might not have delete endpoint, skipping for now
  }, []);

  const clearAll = useCallback(async () => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  const updatePreferences = useCallback((newPrefs: Partial<NotificationPreferences>) => {
    setPreferences(prev => ({ ...prev, ...newPrefs }));
  }, []);

  const value = {
    notifications,
    unreadCount,
    loading,
    preferences,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    updatePreferences,
    refreshNotifications: fetchNotifications,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContext;
