import React, { useState, useEffect } from 'react';
  import io from 'socket.io-client';

  const socket = io('http://localhost:3001');

  const ChatWindow: React.FC = () => {
    const [messages, setMessages] = useState<{ user: string; text: string }[]>([]);
    const [message, setMessage] = useState('');

    useEffect(() => {
      socket.on('message', (msg: { user: string; text: string }) => {
        setMessages((prev) => [...prev, msg]);
      });
      return () => {
        socket.off('message');
      };
    }, []);

    const sendMessage = () => {
      if (message.trim()) {
        socket.emit('message', { text: message });
        setMessage('');
      }
    };

    return (
      <div className="p-4 border rounded-lg">
        <h2 className="text-2xl font-bold mb-2">Community Chat</h2>
        <div className="h-64 overflow-y-auto border p-2 mb-2">
          {messages.map((msg, index) => (
            <p key={index}>
              <strong>{msg.user}</strong>: {msg.text}
            </p>
          ))}
        </div>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="border p-2 w-full mb-2"
          placeholder="Type a message"
        />
        <button
          onClick={sendMessage}
          className="bg-blue-600 text-white p-2 rounded"
        >
          Send
        </button>
      </div>
    );
  };

  export default ChatWindow;