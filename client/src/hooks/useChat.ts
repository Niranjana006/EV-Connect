import { useState, useEffect } from 'react';
  import io from 'socket.io-client';

  const socket = io('http://localhost:3001');

  export const useChat = () => {
    const [messages, setMessages] = useState<{ user: string; text: string }[]>([]);

    useEffect(() => {
      socket.on('message', (msg: { user: string; text: string }) => {
        setMessages((prev) => [...prev, msg]);
      });
      return () => {
        socket.off('message');
      };
    }, []);

    const sendMessage = (text: string) => {
      socket.emit('message', { text });
    };

    return { messages, sendMessage };
  };