const express = require('express');
const { getUsers, searchUsers, updateUserProfile } = require('../controllers/userController.js');
const { protect } = require('../middleware/authMiddleware.js');
const router = express.Router();

router.route('/profile').put(protect, updateUserProfile); // 👈 Add this new profile update route
router.route('/search').get(protect, searchUsers);
router.route('/').get(protect, getUsers);

module.exports = router;