// const express = require('express');
// const http = require('http');
// const { Server } = require('socket.io');
// const dotenv = require('dotenv');
// const connectDB = require('./config/db'); 
// const authRoutes = require('./routes/authRoutes.js');
// const userRoutes = require('./routes/userRoutes.js');
// const messageRoutes = require('./routes/messageRoutes.js');
// const Message = require('./models/Message.js');
// const User = require('./models/User.js');

// dotenv.config();
// connectDB();

// const app = express();
// app.use(express.json()); 

// const server = http.createServer(app);
// const io = new Server(server, {
//   cors: {
//     origin: "*", 
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
  
//   if (userId && userId !== 'undefined') {
//     userSocketMap[userId] = socket.id;
//     User.findByIdAndUpdate(userId, { isOnline: true }).catch(err => console.error(err));
//   }

//   io.emit('getOnlineUsers', Object.keys(userSocketMap));

//   socket.on('typing:start', (receiverId) => {
//     io.emit('typing:global', { senderId: userId, receiverId: receiverId, isTyping: true });
//   });

//   socket.on('typing:stop', (receiverId) => {
//     io.emit('typing:global', { senderId: userId, receiverId: receiverId, isTyping: false });
//   });

//   socket.on('message:send', async (data) => {
//     try {
//       const { senderId, receiverId, message } = data;
//       const newMessage = new Message({ senderId, receiverId, message });
//       const receiverSocketId = userSocketMap[receiverId];
      
//       if (receiverSocketId) {
//         newMessage.status = 'delivered';
//       }
//       await newMessage.save();

//       if (receiverSocketId) {
//         io.to(receiverSocketId).emit('message:new', newMessage);
//       }
//       socket.emit('message:new', newMessage);
//     } catch (error) {
//       console.error('Error in message:send event:', error);
//     }
//   });

//   socket.on('message:read', async ({ senderId, receiverId }) => {
//     try {
//       await Message.updateMany(
//         { senderId: senderId, receiverId: receiverId, status: { $ne: 'read' } },
//         { $set: { status: 'read' } }
//       );
      
//       const senderSocketId = userSocketMap[senderId];
//       if (senderSocketId) {
//         io.to(senderSocketId).emit('messages:seen', { receiverId: receiverId });
//       }
      
//       const readerSocketId = userSocketMap[receiverId];
//       if (readerSocketId) {
//         io.to(readerSocketId).emit('refresh:userlist');
//       }

//     } catch (error) {
//       console.error('Error in message:read event:', error);
//     }
//   });

//   socket.on('disconnect', async () => {
//     let disconnectedUserId;
//     for (let uid in userSocketMap) {
//       if (userSocketMap[uid] === socket.id) {
//         disconnectedUserId = uid;
//         delete userSocketMap[uid];
//         break;
//       }
//     }
    
//     if (disconnectedUserId) {
//       console.log(`User ${disconnectedUserId} disconnected`);
//       await User.findByIdAndUpdate(disconnectedUserId, { isOnline: false, lastSeen: new Date() });
//       io.emit('getOnlineUsers', Object.keys(userSocketMap));
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
const User = require('./models/User.js');

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
    User.findByIdAndUpdate(userId, { isOnline: true }).catch(err => console.error(err));
  }

  io.emit('getOnlineUsers', Object.keys(userSocketMap));

  socket.on('typing:start', (receiverId) => {
    io.emit('typing:global', { senderId: userId, receiverId: receiverId, isTyping: true });
  });

  socket.on('typing:stop', (receiverId) => {
    io.emit('typing:global', { senderId: userId, receiverId: receiverId, isTyping: false });
  });

  // socket.on('message:send', async (data) => {
  //   try {
  //     const { senderId, receiverId, message } = data;
  //     const newMessage = new Message({ senderId, receiverId, message });
  //     const receiverSocketId = userSocketMap[receiverId];
      
  //     if (receiverSocketId) {
  //       newMessage.status = 'delivered';
  //     }
  //     await newMessage.save();

  //     if (receiverSocketId) {
  //       io.to(receiverSocketId).emit('message:new', newMessage);
  //     }
  //     socket.emit('message:new', newMessage);
  //   } catch (error) {
  //     console.error('Error in message:send event:', error);
  //   }
  // });
  socket.on('message:send', async (data) => {
    try {
      const { senderId, receiverId, message } = data;
      const newMessage = new Message({ senderId, receiverId, message });
      const receiverSocketId = userSocketMap[receiverId];
      
      if (receiverSocketId) {
        newMessage.status = 'delivered';
      }
      await newMessage.save();

      // Notify the receiver's chat screen if it's open
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('message:new', newMessage);
      }
      
      // Always send the message back to the sender
      socket.emit('message:new', newMessage);

      // 👇 ADD THIS: Emit a preview event to both users' home screens
      const senderSocketId = userSocketMap[senderId];
      if (senderSocketId) {
          io.to(senderSocketId).emit('new:message_preview', {
              from: senderId,
              to: receiverId,
              message: newMessage,
          });
      }
      if (receiverSocketId) {
          io.to(receiverSocketId).emit('new:message_preview', {
              from: senderId,
              to: receiverId,
              message: newMessage,
          });
      }

    } catch (error) {
      console.error('Error in message:send event:', error);
    }
  });

  socket.on('message:read', async ({ senderId, receiverId }) => {
    try {
      const query = { senderId: senderId, receiverId: receiverId, status: { $ne: 'read' } };
      
      const messagesToUpdate = await Message.find(query).select('_id');
      const messageIds = messagesToUpdate.map(m => m._id.toString());

      if (messageIds.length > 0) {
        await Message.updateMany({ _id: { $in: messageIds } }, { $set: { status: 'read' } });
        
        const senderSocketId = userSocketMap[senderId];
        if (senderSocketId) {
          io.to(senderSocketId).emit('messages:seen', { receiverId: receiverId });
        }
        
        const readerSocketId = userSocketMap[receiverId];
        if (readerSocketId) {
          io.to(readerSocketId).emit('messages:updatedByIds', { messageIds, readerId: receiverId });
          io.to(readerSocketId).emit('refresh:userlist');
        }
      }
    } catch (error) {
      console.error('Error in message:read event:', error);
    }
  });

  socket.on('disconnect', async () => {
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
      await User.findByIdAndUpdate(disconnectedUserId, { isOnline: false, lastSeen: new Date() });
      io.emit('getOnlineUsers', Object.keys(userSocketMap));
    }
    
    console.log('User disconnected:', socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});