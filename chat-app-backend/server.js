// const express = require('express');
// const http = require('http');
// const { Server } = require('socket.io');
// const dotenv = require('dotenv');
// const connectDB = require('./config/db'); 
// const authRoutes = require('./routes/authRoutes.js');
// const userRoutes = require('./routes/userRoutes.js');
// const messageRoutes = require('./routes/messageRoutes.js');
// const Message = require('./models/Message.js');

// dotenv.config();
// connectDB();

// const app = express();
// app.use(express.json()); 

// const server = http.createServer(app);
// const io = new Server(server, {
//   cors: {
//     origin: "*", // Allow all origins for simplicity in development
//     methods: ["GET", "POST"]
//   }
// });

// const PORT = process.env.PORT || 8000;

// app.get('/', (req, res) => {
//   res.send('Server is running.');
// });

// app.use('/api/auth', authRoutes); 
// app.use('/api/users', userRoutes);
// app.use('/api/messages', messageRoutes);

// const userSocketMap = {}; // { userId: socketId }

// io.on('connection', (socket) => {
//   console.log('A user connected:', socket.id);
//   const userId = socket.handshake.query.userId;
  
//   if (userId) {
//     userSocketMap[userId] = socket.id;
//     console.log(`User ${userId} connected with socket ${socket.id}`);
//     socket.broadcast.emit('user:online', userId);
//   }

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

//   socket.on('message:send', async (data) => {
//     const { senderId, receiverId, message } = data;

//     const newMessage = new Message({
//         senderId,
//         receiverId,
//         message,
//     });
    
//     const receiverSocketId = userSocketMap[receiverId];
//     if (receiverSocketId) {
//       newMessage.status = 'delivered';
//       io.to(receiverSocketId).emit('message:new', newMessage);
//     }

//     await newMessage.save();
//     socket.emit('message:new', newMessage);
//   });

//   socket.on('message:read', async ({ senderId, receiverId }) => {
//     await Message.updateMany(
//       { senderId: senderId, receiverId: receiverId, status: { $ne: 'read' } },
//       { $set: { status: 'read' } }
//     );
    
//     const senderSocketId = userSocketMap[senderId];
//     if (senderSocketId) {
//       io.to(senderSocketId).emit('messages:seen', { receiverId: receiverId });
//     }
//   });

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
const connectDB = require('./config/db'); 
const authRoutes = require('./routes/authRoutes.js');
const userRoutes = require('./routes/userRoutes.js');
const messageRoutes = require('./routes/messageRoutes.js');
const Message = require('./models/Message.js');

dotenv.config();
connectDB();

const app = express();
app.use(express.json()); 

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", 
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 8000;

app.get('/', (req, res) => {
  res.send('Server is running.');
});

app.use('/api/auth', authRoutes); 
app.use('/api/users', userRoutes);
app.use('/api/messages', messageRoutes);

const userSocketMap = {}; // { userId: socketId }

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);
  const userId = socket.handshake.query.userId;
  
  if (userId && userId !== 'undefined') {
    userSocketMap[userId] = socket.id;
  }

  // Send the updated list of online users to all clients
  io.emit('getOnlineUsers', Object.keys(userSocketMap));

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

  socket.on('message:send', async (data) => {
    const { senderId, receiverId, message } = data;

    const newMessage = new Message({
        senderId,
        receiverId,
        message,
    });
    
    const receiverSocketId = userSocketMap[receiverId];
    if (receiverSocketId) {
      newMessage.status = 'delivered';
      io.to(receiverSocketId).emit('message:new', newMessage);
    }

    await newMessage.save();
    socket.emit('message:new', newMessage);
  });

  socket.on('message:read', async ({ senderId, receiverId }) => {
    await Message.updateMany(
      { senderId: senderId, receiverId: receiverId, status: { $ne: 'read' } },
      { $set: { status: 'read' } }
    );
    
    const senderSocketId = userSocketMap[senderId];
    if (senderSocketId) {
      io.to(senderSocketId).emit('messages:seen', { receiverId: receiverId });
    }
  });

  socket.on('disconnect', () => {
    let disconnectedUserId;
    for (let uid in userSocketMap) {
      if (userSocketMap[uid] === socket.id) {
        disconnectedUserId = uid;
        delete userSocketMap[uid];
        break;
      }
    }
    
    if (disconnectedUserId) {
      console.log(`User ${disconnectedUserId} disconnected`);
      io.emit('getOnlineUsers', Object.keys(userSocketMap));
    }
    
    console.log('User disconnected:', socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});