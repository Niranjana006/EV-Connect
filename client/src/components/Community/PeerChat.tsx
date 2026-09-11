import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import { db } from '../../services/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';

const PeerChat: React.FC = () => {
  const { user, isInCommunity } = useAuth();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<{ userUid: string; userEmail: string; text: string; timestamp: Date; targetUid?: string }[]>([]);
  const [socket, setSocket] = useState<any>(null);
  const [targetUserUid, setTargetUserUid] = useState<string | null>(null);
  const [communityUsers, setCommunityUsers] = useState<any[]>([]);

  useEffect(() => {
    if (!isInCommunity || !user) {
      setTargetUserUid(null);
      setMessages([]);
      return;
    }

    const newSocket = io('http://127.0.0.1:4000', {
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      transports: ['websocket'],
      timeout: 10000,
      query: { userId: user.uid, email: user.email }
    });
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Connected to WebSocket:', newSocket.id);
    });

    newSocket.on('connect_error', (err) => {
      console.error('Connection error:', err.message);
    });

    newSocket.on('message', (msg: any) => {
      console.log('Message received by client:', JSON.stringify(msg, null, 2)); // Log full object
      if (msg.text && msg.targetUid === user.uid) { // Simplified condition
        const updatedMessage = {
          userUid: msg.userUid || 'UnknownUid', // Fallback
          userEmail: msg.userEmail || 'Unknown',
          text: msg.text,
          timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date(),
          targetUid: msg.targetUid
        };
        setMessages((prev) => {
          const updated = [...prev, updatedMessage].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
          console.log('Updated messages state:', updated);
          return updated;
        });
      } else {
        console.log('Message ignored:', JSON.stringify(msg, null, 2));
      }
    });

    newSocket.on('error', (err) => {
      console.error('Socket error:', err.message);
    });

    const q = query(collection(db, 'users'), where('inCommunity', '==', true));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const users = snapshot.docs
        .map(doc => ({ id: doc.id, email: doc.data().email }))
        .filter(u => u.id !== user.uid);
      setCommunityUsers(users);
      console.log('Community users:', users);
    });

    return () => {
      unsubscribe();
      newSocket.disconnect();
    };
  }, [isInCommunity, user, targetUserUid]);

  const sendMessage = () => {
    if (socket && message.trim() && targetUserUid) {
      const msgPayload = {
        text: message,
        targetUid: targetUserUid,
        userUid: user.uid,
        userEmail: user.email,
        timestamp: Date.now()
      };
      socket.emit('message', msgPayload);
      setMessages((prev) => [...prev, {
        userUid: user.uid,
        userEmail: user.email,
        text: message,
        timestamp: new Date(),
        targetUid: targetUserUid
      }].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime()));
      setMessage('');
      console.log('Sent message:', JSON.stringify(msgPayload, null, 2));
    } else {
      console.error('Send failed:', { socket: !!socket, message, targetUserUid });
    }
  };

  const selectUser = (userId: string) => {
    console.log('Button clicked, selecting user:', userId);
    setTargetUserUid(userId);
    console.log('Target user set to:', userId);
    setMessages((prev) => prev.filter(msg => msg.targetUid === userId || msg.userUid === userId));
  };

  if (!isInCommunity) return <div className="text-center">Join community to chat with others.</div>;

  return (
    <div className="p-4 border rounded-lg" key={messages.length}> {/* Force re-render */}
      <h2 className="text-2xl font-bold mb-2">Peer Chat</h2>
      
      <div className="mb-4">
        <h3 className="text-lg font-semibold">Select User to Chat:</h3>
        <ul>
          {communityUsers.map((u) => (
            <li key={u.id} className="mb-2">
              {u.email} <button onClick={() => selectUser(u.id)} className="bg-green-500 text-white px-2 py-1 rounded ml-2">Chat</button>
            </li>
          ))}
        </ul>
      </div>

      {targetUserUid && (
        <>
          <div className="h-40 overflow-y-auto border p-2 mb-2">
            {messages.map((msg, index) => (
              <p key={index} className={msg.userUid === user.uid ? 'text-right' : 'text-left'}>
                <span className="font-bold">{msg.userEmail}</span>: {msg.text} <span className="text-xs text-gray-500">{msg.timestamp.toLocaleTimeString()}</span>
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
        </>
      )}
    </div>
  );
};

export default PeerChat;