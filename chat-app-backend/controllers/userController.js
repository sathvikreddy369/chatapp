const User = require('../models/User.js');

const getUsers = async (req, res) => {
  // Find all users except the one who is currently logged in
  const users = await User.find({ _id: { $ne: req.user._id } }).select('-password');
  res.json(users);
};

module.exports = { getUsers };