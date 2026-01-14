import React from 'react';
import { useMessaging } from '../contexts/MessagingContext';

/**
 * ChatList Component - Displays list of conversations
 * @param {Object} props - Component props
 * @param {Array} props.conversations - Array of conversation objects
 * @param {Object} props.activeChat - Currently active chat
 * @param {Function} props.onChatSelect - Function to call when chat is selected
 */
const ChatList = ({ conversations, activeChat, onChatSelect }) => {
  const { unreadCounts, isUserOnline, getConversationId, markAsRead } = useMessaging();

  /**
   * Handle chat selection
   * @param {Object} conversation - Conversation object
   */
  const handleChatSelect = (conversation) => {
    const conversationId = getConversationId(conversation.user_id, conversation.user_id); // This needs to be fixed - we need both user IDs
    markAsRead(conversationId);
    onChatSelect(conversation);
  };

  /**
   * Format message timestamp
   * @param {string} timestamp - ISO timestamp
   * @returns {string} - Formatted time
   */
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;

    if (diff < 60000) { // Less than 1 minute
      return 'now';
    } else if (diff < 3600000) { // Less than 1 hour
      return `${Math.floor(diff / 60000)}m`;
    } else if (diff < 86400000) { // Less than 1 day
      return `${Math.floor(diff / 3600000)}h`;
    } else {
      return date.toLocaleDateString();
    }
  };

  if (conversations.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <p className="text-gray-500 text-sm">No conversations yet</p>
          <p className="text-gray-400 text-xs mt-1">Start chatting with friends!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-y-auto h-full">
      {conversations.map((conversation) => {
        const conversationId = getConversationId(conversation.user_id, conversation.user_id); // This needs proper user IDs
        const unreadCount = unreadCounts[conversationId] || 0;
        const isOnline = isUserOnline(conversation.user_id);
        const isActive = activeChat && activeChat.user_id === conversation.user_id;

        return (
          <div
            key={conversation.user_id}
            onClick={() => handleChatSelect(conversation)}
            className={`p-4 border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors duration-200 ${
              isActive ? 'bg-purple-50 border-l-4 border-l-purple-500' : ''
            }`}
          >
            <div className="flex items-center space-x-3">
              {/* Avatar with online status */}
              <div className="relative">
                <img
                  src={conversation.avatar || `https://placehold.co/40x40/4ECDC4/FFFFFF?text=${conversation.username?.charAt(0) || 'U'}`}
                  alt={conversation.username || 'User'}
                  className="w-10 h-10 rounded-full object-cover"
                />
                {isOnline && (
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                )}
              </div>

              {/* Chat info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-gray-900 truncate">
                    {conversation.username || 'Unknown User'}
                  </h3>
                  {conversation.last_message && (
                    <span className="text-xs text-gray-500">
                      {formatTime(conversation.last_message.created_at)}
                    </span>
                  )}
                </div>

                {conversation.last_message && (
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-sm text-gray-600 truncate">
                      {conversation.last_message.content}
                    </p>
                    {unreadCount > 0 && (
                      <span className="bg-purple-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ChatList;
