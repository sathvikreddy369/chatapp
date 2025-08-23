// const express = require('express');
// const http = require('http');
// const { Server } = require('socket.io');
// const dotenv = require('dotenv');
// dotenv.config();

// const connectDB = require('./config/db'); 
// const authRoutes = require('./routes/authRoutes.js');
// const userRoutes = require('./routes/userRoutes.js');
// const messageRoutes = require('./routes/messageRoutes.js');
// const Message = require('./models/Message.js'); // ✅ Import Message model

// connectDB();

// const app = express();
// app.use(express.json()); 

// const server = http.createServer(app);
// const io = new Server(server);

// const PORT = process.env.PORT || 5000;

// app.get('/', (req, res) => {
//   res.send('Server is running.');
// });

// app.use('/api/auth', authRoutes); 
// app.use('/api/users', userRoutes);
// app.use('/api/messages', messageRoutes); 

// // Map to track online users: { userId: socketId }
// const userSocketMap = {}; 

// io.on('connection', (socket) => {
//   console.log('A user connected:', socket.id);

//   const userId = socket.handshake.query.userId;
//   if (userId) {
//     userSocketMap[userId] = socket.id;
//     console.log(`User ${userId} connected with socket ${socket.id}`);

//     // Notify others this user is online
//     socket.broadcast.emit('user:online', userId);
//   }

//   // Typing events
//   socket.on('typing:start', (receiverId) => {
//     const receiverSocketId = userSocketMap[receiverId];
//     if (receiverSocketId) {
//       io.to(receiverSocketId).emit('typing:start', userId);
//     }
//   });

//   socket.on('typing:stop', (receiverId) => {
//     const receiverSocketId = userSocketMap[receiverId];
//     if (receiverSocketId) {
//       io.to(receiverSocketId).emit('typing:stop', userId);
//     }
//   });

//   // Sending messages
//   socket.on('message:send', async (data) => {
//     const { senderId, receiverId, message } = data;

//     const newMessage = new Message({
//       senderId,
//       receiverId,
//       message,
//     });
//     await newMessage.save();

//     const receiverSocketId = userSocketMap[receiverId]; // ✅ FIXED (was missing)
//     if (receiverSocketId) {
//       newMessage.status = 'delivered';
//       await newMessage.save();
//       io.to(receiverSocketId).emit('message:new', newMessage);
//     }

//     // Also emit back to sender
//     socket.emit('message:new', newMessage);
//   });

//   // Mark messages as read
//   socket.on('message:read', async ({ senderId, receiverId }) => {
//     await Message.updateMany(
//       { senderId, receiverId, status: { $ne: 'read' } },
//       { $set: { status: 'read' } }
//     );

//     const senderSocketId = userSocketMap[senderId];
//     if (senderSocketId) {
//       io.to(senderSocketId).emit('messages:seen', { receiverId });
//     }
//   });

//   // Handle disconnect
//   socket.on('disconnect', () => {
//     for (let uid in userSocketMap) {
//       if (userSocketMap[uid] === socket.id) {
//         delete userSocketMap[uid];
//         console.log(`User ${uid} disconnected`);
//         socket.broadcast.emit('user:offline', uid);
//         break;
//       }
//     }
//     console.log('User disconnected:', socket.id);
//   });
// });

// server.listen(PORT, () => {
//   console.log(`Server is running on port ${PORT}`);
// });



const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const dotenv = require('dotenv');
const cors = require('cors');

dotenv.config();

const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes.js');
const userRoutes = require('./routes/userRoutes.js');
const messageRoutes = require('./routes/messageRoutes.js');
const Message = require('./models/Message.js');

connectDB();

const app = express();
app.use(express.json());

// ✅ Enable CORS (important for React Native)
app.use(cors({
  origin: '*', // change to frontend domain in production
  methods: ['GET', 'POST'],
  credentials: true,
}));

const server = http.createServer(app);

// ✅ Socket.IO with CORS
const io = new Server(server, {
  cors: {
    origin: '*', // change to frontend domain in production
    methods: ['GET', 'POST'],
  },
});

const PORT = process.env.PORT || 8000;

// Routes
app.get('/', (req, res) => {
  res.send('Server is running.');
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/messages', messageRoutes);

// ✅ Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({ error: 'Server error' });
});

// ================= SOCKET.IO LOGIC =================

// Map to track online users: { userId: socketId }
const userSocketMap = {};

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  const userId = socket.handshake.query.userId;
  if (userId) {
    userSocketMap[userId] = socket.id;
    console.log(`User ${userId} connected with socket ${socket.id}`);

    // ✅ Emit updated online users list to all clients
    io.emit('getOnlineUsers', Object.keys(userSocketMap));

    // Notify others this user is online
    socket.broadcast.emit('user:online', userId);
  }

  // Typing events
  socket.on('typing:start', (receiverId) => {
    const receiverSocketId = userSocketMap[receiverId];
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('typing:start', userId);
    }
  });

  socket.on('typing:stop', (receiverId) => {
    const receiverSocketId = userSocketMap[receiverId];
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('typing:stop', userId);
    }
  });

  // Sending messages
  socket.on('message:send', async (data) => {
    const { senderId, receiverId, message } = data;

    const newMessage = new Message({
      senderId,
      receiverId,
      message,
    });
    await newMessage.save();

    const receiverSocketId = userSocketMap[receiverId];
    if (receiverSocketId) {
      newMessage.status = 'delivered';
      await newMessage.save();
      io.to(receiverSocketId).emit('message:new', newMessage);
    }

    // Also emit back to sender
    socket.emit('message:new', newMessage);
  });

  // Mark messages as read
  socket.on('message:read', async ({ senderId, receiverId }) => {
    await Message.updateMany(
      { senderId, receiverId, status: { $ne: 'read' } },
      { $set: { status: 'read' } }
    );

    const senderSocketId = userSocketMap[senderId];
    if (senderSocketId) {
      io.to(senderSocketId).emit('messages:seen', { receiverId });
    }
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    for (let uid in userSocketMap) {
      if (userSocketMap[uid] === socket.id) {
        delete userSocketMap[uid];
        console.log(`User ${uid} disconnected`);

        // ✅ Emit updated online users list
        io.emit('getOnlineUsers', Object.keys(userSocketMap));

        // Notify others this user is offline
        socket.broadcast.emit('user:offline', uid);
        break;
      }
    }
    console.log('User disconnected:', socket.id);
  });
});

// ================= SERVER START =================
server.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
