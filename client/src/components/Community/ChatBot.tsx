import React, { useState, useEffect } from 'react';
import { useLocation } from '../../hooks/useLocation';

const ChatBot: React.FC = () => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<string[]>([]);
  const { position } = useLocation();

  const sendMessage = async () => {
    if (!message.trim()) return;
    try {
      const res = await fetch('http://localhost:5000/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, lat: position?.lat, lng: position?.lng })
      });
      const data = await res.json();
      setMessages([...messages, `You: ${message}`, `Bot: ${data.response}`]);
      setMessage('');
    } catch (error) {
      console.error('Chatbot error:', error);
    }
  };

  return (
    <div className="p-4 border rounded-lg">
      <h2 className="text-2xl font-bold mb-2">EVConnect ChatBot</h2>
      <div className="h-40 overflow-y-auto border p-2 mb-2">
        {messages.map((msg, index) => (
          <p key={index}>{msg}</p>
        ))}
      </div>
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        className="border p-2 w-full mb-2"
        placeholder="Ask about charging..."
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

export default ChatBot;