import React, { useState, useRef } from 'react';
import { useMessaging } from '../contexts/MessagingContext';

/**
 * MessageInput Component - Input field for sending messages
 * @param {Object} props - Component props
 * @param {string} props.recipientId - ID of message recipient
 */
const MessageInput = ({ recipientId }) => {
  const { sendMessage, isConnected } = useMessaging();
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const textareaRef = useRef(null);

  /**
   * Handle message input change
   * @param {Event} e - Input change event
   */
  const handleInputChange = (e) => {
    setMessage(e.target.value);

    // Auto-resize textarea
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 100)}px`;
    }
  };

  /**
   * Handle message send
   * @param {Event} e - Form submit event
   */
  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!message.trim() || isSending || !isConnected) return;

    setIsSending(true);
    try {
      await sendMessage(recipientId, message.trim());
      setMessage('');

      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      // Could show error toast here
    } finally {
      setIsSending(false);
    }
  };

  /**
   * Handle keyboard shortcuts
   * @param {Event} e - Key press event
   */
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  return (
    <div className="border-t border-gray-100 bg-white p-4">
      <form onSubmit={handleSendMessage} className="flex items-end space-x-3">
        {/* Message input */}
        <div className="flex-1">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder={isConnected ? "Type a message..." : "Connecting..."}
            disabled={!isConnected || isSending}
            rows={1}
            className="w-full px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-transparent resize-none max-h-24 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ minHeight: '40px' }}
          />
        </div>

        {/* Send button */}
        <button
          type="submit"
          disabled={!message.trim() || !isConnected || isSending}
          className="p-2 bg-purple-500 text-white rounded-full hover:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-300 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
        >
          {isSending ? (
            <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          )}
        </button>
      </form>

      {/* Connection status */}
      {!isConnected && (
        <div className="flex items-center mt-2 text-xs text-gray-500">
          <div className="w-2 h-2 bg-red-500 rounded-full mr-2 animate-pulse"></div>
          Connecting to chat server...
        </div>
      )}
    </div>
  );
};

export default MessageInput;
