const User = require('../models/User.js');
const Message = require('../models/Message.js');
const mongoose = require('mongoose');

const getUsers = async (req, res) => {
  try {
    const currentUserId = new mongoose.Types.ObjectId(req.user._id);

    const users = await User.aggregate([
      // Exclude the current user
      { $match: { _id: { $ne: currentUserId } } },
      
      // Step 1: Find the last message for each user conversation
      {
        $lookup: {
          from: 'messages',
          let: { userId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $or: [
                    { $and: [{ $eq: ['$senderId', '$$userId'] }, { $eq: ['$receiverId', currentUserId] }] },
                    { $and: [{ $eq: ['$senderId', currentUserId] }, { $eq: ['$receiverId', '$$userId'] }] }
                  ]
                }
              }
            },
            { $sort: { createdAt: -1 } },
            { $limit: 1 }
          ],
          as: 'lastMessage'
        }
      },
      // Deconstruct the lastMessage array
      { $unwind: { path: '$lastMessage', preserveNullAndEmptyArrays: true } },

      // Step 2: Count unread messages
      {
        $lookup: {
          from: 'messages',
          let: { userId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$senderId', '$$userId'] },
                    { $eq: ['$receiverId', currentUserId] },
                    { $ne: ['$status', 'read'] }
                  ]
                }
              }
            },
            { $count: 'unreadCount' }
          ],
          as: 'unreadInfo'
        }
      },
      { $unwind: { path: '$unreadInfo', preserveNullAndEmptyArrays: true } },
      
      // Step 3: Sort users by the last message's timestamp (newest first)
      {
        $sort: {
          'lastMessage.createdAt': -1
        }
      },

      // Step 4: Project the final fields
      {
        $project: {
          _id: 1,
          username: 1,
          email: 1,
          isOnline: 1,
          lastSeen: 1,
          unreadCount: { $ifNull: ['$unreadInfo.unreadCount', 0] },
          lastMessage: { $ifNull: ['$lastMessage.message', ''] }, // Optional: include last message text
          lastMessageTimestamp: { $ifNull: ['$lastMessage.createdAt', null] } // Optional: include timestamp
        }
      }
    ]);
    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: 'Server Error' });
  }
};

const searchUsers = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) {
      return res.json([]);
    }

    const users = await User.find({
      username: { $regex: query, $options: 'i' }, // 'i' for case-insensitive
      _id: { $ne: req.user._id }
    }).select('-password');
    
    res.json(users);
  } catch (error) {
    console.error("Error searching users:", error);
    res.status(500).json({ message: 'Server Error' });
  }
};

const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      // Check if the new username is already taken by another user
      const { username } = req.body;
      if (username) {
        const existingUser = await User.findOne({ username });
        if (existingUser && existingUser._id.toString() !== user._id.toString()) {
          return res.status(400).json({ message: 'Username is already taken' });
        }
        user.username = username;
      }

      const updatedUser = await user.save();

      res.json({
        _id: updatedUser._id,
        username: updatedUser.username,
        email: updatedUser.email,
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

module.exports = { getUsers, searchUsers, updateUserProfile };