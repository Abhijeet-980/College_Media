import React, { useState, useEffect } from 'react';
import { useMessaging } from '../contexts/MessagingContext';
import ChatList from './ChatList';
import ChatWindow from './ChatWindow';

/**
 * Messages Component - Main messaging interface
 * Displays chat list and active chat window
 */
const Messages = () => {
  const { conversations, getTotalUnreadCount } = useMessaging();
  const [activeChat, setActiveChat] = useState(null);

  /**
   * Handle selecting a chat from the list
   * @param {Object} conversation - Conversation object
   */
  const handleChatSelect = (conversation) => {
    setActiveChat(conversation);
  };

  /**
   * Handle closing the active chat
   */
  const handleCloseChat = () => {
    setActiveChat(null);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm h-[calc(100vh-12rem)] overflow-hidden">
      <div className="flex h-full">
        {/* Chat List Sidebar */}
        <div className={`${activeChat ? 'hidden md:block' : 'block'} w-full md:w-80 border-r border-gray-100`}>
          <div className="p-4 border-b border-gray-100">
            <h2 className="text-xl font-bold text-gray-800">Messages</h2>
            <p className="text-sm text-gray-500 mt-1">
              {getTotalUnreadCount() > 0 && `${getTotalUnreadCount()} unread message${getTotalUnreadCount() !== 1 ? 's' : ''}`}
            </p>
          </div>
          <ChatList
            conversations={conversations}
            activeChat={activeChat}
            onChatSelect={handleChatSelect}
          />
        </div>

        {/* Chat Window */}
        <div className={`${activeChat ? 'block' : 'hidden md:block'} flex-1`}>
          {activeChat ? (
            <ChatWindow
              conversation={activeChat}
              onClose={handleCloseChat}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-600 mb-2">Select a conversation</h3>
                <p className="text-gray-500">Choose a chat from the list to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Messages;
