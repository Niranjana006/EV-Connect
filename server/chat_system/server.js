const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: { origin: "*" }
});

const users = {};

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);
  const userUid = socket.handshake.query.userId;
  const userEmail = socket.handshake.query.email;
  if (userUid) {
    users[userUid] = socket.id;
    console.log('User mapped:', { userUid, socketId: socket.id, userEmail, users: Object.keys(users) });
  }

  socket.on('message', (msg) => {
    console.log('Message received:', JSON.stringify(msg, null, 2)); // Log full object
    if (msg.targetUid && users[msg.targetUid]) {
      const targetSocketId = users[msg.targetUid];
      if (io.sockets.sockets.get(targetSocketId)) {
        io.to(targetSocketId).emit('message', {
          userUid: msg.userUid,
          userEmail: msg.userEmail,
          text: msg.text,
          timestamp: msg.timestamp,
          targetUid: userUid
        });
        console.log(`Message sent to ${msg.targetUid} (Socket ID: ${targetSocketId}) from ${userUid} with payload:`, JSON.stringify({
          userUid: msg.userUid,
          userEmail: msg.userEmail,
          text: msg.text,
          timestamp: msg.timestamp,
          targetUid: userUid
        }, null, 2));
      } else {
        console.log(`Target socket ${msg.targetUid} not active, Users map:`, Object.keys(users));
      }
      // Echo to sender
      socket.emit('message', {
        userUid: msg.userUid,
        userEmail: msg.userEmail,
        text: msg.text,
        timestamp: msg.timestamp,
        targetUid: msg.targetUid
      });
      console.log(`Message echoed to sender ${userUid} (Socket ID: ${socket.id}) with payload:`, JSON.stringify({
        userUid: msg.userUid,
        userEmail: msg.userEmail,
        text: msg.text,
        timestamp: msg.timestamp,
        targetUid: msg.targetUid
      }, null, 2));
    } else {
      console.log('Invalid targetUid or no targetUid:', msg.targetUid, 'Users:', Object.keys(users));
    }
  });

  socket.on('disconnect', () => {
    console.log('Disconnected:', socket.id);
    const disconnectedUserUid = Object.keys(users).find(key => users[key] === socket.id);
    if (disconnectedUserUid) {
      delete users[disconnectedUserUid];
      console.log('User disconnected:', disconnectedUserUid, 'Updated users map:', Object.keys(users));
    }
  });
});

server.listen(4000, () => {
  console.log('Chat server running on port 4000');
});