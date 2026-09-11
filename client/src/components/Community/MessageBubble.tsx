import React from 'react';

  interface MessageBubbleProps {
    user: string;
    text: string;
    isOwnMessage: boolean;
  }

  const MessageBubble: React.FC<MessageBubbleProps> = ({ user, text, isOwnMessage }) => {
    return (
      <div
        className={`p-2 my-1 rounded-lg ${
          isOwnMessage ? 'bg-blue-100 ml-auto' : 'bg-gray-100'
        } w-3/4`}
      >
        <strong>{user}</strong>: {text}
      </div>
    );
  };

  export default MessageBubble;