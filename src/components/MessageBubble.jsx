import React from 'react';
import { useAuth } from '../contexts/AuthContext';

/**
 * MessageBubble Component - Displays individual message
 * @param {Object} props - Component props
 * @param {Object} props.message - Message object
 */
const MessageBubble = ({ message }) => {
  const { user } = useAuth();
  const isOwnMessage = message.sender_id === user?.id;

  /**
   * Format message timestamp
   * @param {string} timestamp - ISO timestamp
   * @returns {string} - Formatted time
   */
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-2`}>
      <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
        isOwnMessage
          ? 'bg-purple-500 text-white rounded-br-md'
          : 'bg-white text-gray-800 rounded-bl-md shadow-sm'
      }`}>
        <p className="text-sm leading-relaxed">{message.content}</p>
        <div className={`flex items-center mt-1 space-x-1 ${
          isOwnMessage ? 'justify-end' : 'justify-start'
        }`}>
          <span className={`text-xs ${
            isOwnMessage ? 'text-purple-200' : 'text-gray-500'
          }`}>
            {formatTime(message.created_at)}
          </span>
          {isOwnMessage && message.is_read && (
            <svg className="w-3 h-3 text-purple-200" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
