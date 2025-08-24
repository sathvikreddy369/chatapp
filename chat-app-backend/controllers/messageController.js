const Message = require('../models/Message.js');

const getMessages = async (req, res) => {
  try {
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    // Correctly define pagination variables
    const page = parseInt(req.query.page) || 1;
    const limit = 20; // Number of messages per page
    const skip = (page - 1) * limit;

    const messages = await Message.find({
      $or: [
        { senderId: senderId, receiverId: receiverId },
        { senderId: receiverId, receiverId: senderId },
      ],
    })
    .sort({ createdAt: -1 }) // Sort by newest first
    .skip(skip)
    .limit(limit);

    // Send the data directly (newest messages first)
    res.status(200).json(messages);

  } catch (error) {
    console.error("Error in getMessages:", error);
    res.status(500).json({ message: 'Server error' });
  }
};

const sendMessage = async (req, res) => {
  try {
    const senderId = req.user._id; // from auth middleware
    const { receiverId, content } = req.body;

    if (!receiverId || !content) {
      return res.status(400).json({ message: 'Missing receiverId or content' });
    }

    const newMessage = await Message.create({
      senderId,
      receiverId,
      message: content,
    });

    res.status(201).json(newMessage);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getMessages, sendMessage };
