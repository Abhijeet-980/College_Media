import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

/**
 * Messaging Context for managing real-time messaging functionality
 * Handles WebSocket connections, message state, and online status
 */
const MessagingContext = createContext();

/**
 * MessagingProvider component that wraps the app and provides messaging state
 * @param {Object} props - React props
 * @param {React.ReactNode} props.children - Child components
 */
export const MessagingProvider = ({ children }) => {
  const { user, token, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState({});
  const [conversations, setConversations] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [unreadCounts, setUnreadCounts] = useState({});
  const socketRef = useRef(null);

  // Initialize socket connection when user is authenticated
  useEffect(() => {
    if (isAuthenticated && token && !socketRef.current) {
      const newSocket = io('http://localhost:5000', {
        auth: { token },
        transports: ['websocket', 'polling']
      });

      socketRef.current = newSocket;
      setSocket(newSocket);

      // Connection events
      newSocket.on('connect', () => {
        console.log('Connected to messaging server');
        setIsConnected(true);
      });

      newSocket.on('disconnect', () => {
        console.log('Disconnected from messaging server');
        setIsConnected(false);
      });

      // Message events
      newSocket.on('message:new', (messageData) => {
        handleNewMessage(messageData);
      });

      // User status events
      newSocket.on('user:online', (data) => {
        setOnlineUsers(prev => new Set([...prev, data.user_id]));
      });

      newSocket.on('user:offline', (data) => {
        setOnlineUsers(prev => {
          const newSet = new Set(prev);
          newSet.delete(data.user_id);
          return newSet;
        });
      });

      // Notification events
      newSocket.on('notification:new', (notification) => {
        // Handle notifications (could integrate with existing notification system)
        console.log('New notification:', notification);
      });

      return () => {
        newSocket.disconnect();
        socketRef.current = null;
        setSocket(null);
        setIsConnected(false);
      };
    }
  }, [isAuthenticated, token]);

  /**
   * Handle incoming new messages
   * @param {Object} messageData - Message data from server
   */
  const handleNewMessage = (messageData) => {
    const conversationId = getConversationId(messageData.sender_id, messageData.recipient_id);

    setMessages(prev => ({
      ...prev,
      [conversationId]: [...(prev[conversationId] || []), messageData]
    }));

    // Update unread count if message is not from current user
    if (messageData.sender_id !== user?.id) {
      setUnreadCounts(prev => ({
        ...prev,
        [conversationId]: (prev[conversationId] || 0) + 1
      }));
    }

    // Update conversations list
    updateConversationsList(messageData);
  };

  /**
   * Generate conversation ID from two user IDs
   * @param {string} userId1 - First user ID
   * @param {string} userId2 - Second user ID
   * @returns {string} - Conversation ID
   */
  const getConversationId = (userId1, userId2) => {
    return [userId1, userId2].sort().join('_');
  };

  /**
   * Update conversations list with new message
   * @param {Object} messageData - Message data
   */
  const updateConversationsList = (messageData) => {
    const otherUserId = messageData.sender_id === user?.id ? messageData.recipient_id : messageData.sender_id;

    setConversations(prev => {
      const existingIndex = prev.findIndex(conv => conv.user_id === otherUserId);
      const conversationItem = {
        user_id: otherUserId,
        last_message: messageData,
        unread_count: messageData.sender_id !== user?.id ? 1 : 0
      };

      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = conversationItem;
        return updated;
      } else {
        return [conversationItem, ...prev];
      }
    });
  };

  /**
   * Send a message to another user
   * @param {string} recipientId - Recipient user ID
   * @param {string} content - Message content
   */
  const sendMessage = async (recipientId, content) => {
    if (!socket || !isConnected) {
      throw new Error('Not connected to messaging server');
    }

    const messageData = {
      recipient_id: recipientId,
      content: content.trim()
    };

    // Emit message to server
    socket.emit('message:send', messageData);

    // Optimistically add message to local state
    const tempMessage = {
      id: `temp_${Date.now()}`,
      sender_id: user.id,
      recipient_id: recipientId,
      content: content.trim(),
      created_at: new Date().toISOString(),
      is_read: false
    };

    const conversationId = getConversationId(user.id, recipientId);
    setMessages(prev => ({
      ...prev,
      [conversationId]: [...(prev[conversationId] || []), tempMessage]
    }));

    updateConversationsList(tempMessage);
  };

  /**
   * Load conversation history for a user
   * @param {string} otherUserId - Other user's ID
   */
  const loadConversation = async (otherUserId) => {
    try {
      const response = await fetch(`/api/v1/messages/${otherUserId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        const conversationId = getConversationId(user.id, otherUserId);

        setMessages(prev => ({
          ...prev,
          [conversationId]: data.data || []
        }));

        // Mark messages as read
        setUnreadCounts(prev => ({
          ...prev,
          [conversationId]: 0
        }));
      }
    } catch (error) {
      console.error('Failed to load conversation:', error);
    }
  };

  /**
   * Mark conversation as read
   * @param {string} conversationId - Conversation ID
   */
  const markAsRead = (conversationId) => {
    setUnreadCounts(prev => ({
      ...prev,
      [conversationId]: 0
    }));
  };

  /**
   * Get total unread message count
   * @returns {number} - Total unread messages
   */
  const getTotalUnreadCount = () => {
    return Object.values(unreadCounts).reduce((sum, count) => sum + count, 0);
  };

  /**
   * Check if a user is online
   * @param {string} userId - User ID to check
   * @returns {boolean} - Whether user is online
   */
  const isUserOnline = (userId) => {
    return onlineUsers.has(userId);
  };

  const value = {
    socket,
    isConnected,
    messages,
    conversations,
    onlineUsers,
    unreadCounts,
    sendMessage,
    loadConversation,
    markAsRead,
    getTotalUnreadCount,
    isUserOnline,
    getConversationId
  };

  return (
    <MessagingContext.Provider value={value}>
      {children}
    </MessagingContext.Provider>
  );
};

/**
 * Hook to use messaging context
 * @returns {Object} - Messaging context value
 */
export const useMessaging = () => {
  const context = useContext(MessagingContext);
  if (!context) {
    throw new Error('useMessaging must be used within a MessagingProvider');
  }
  return context;
};
