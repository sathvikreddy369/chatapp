const express = require('express');
const { getUsers } = require('../controllers/userController.js');
const { protect } = require('../middleware/authMiddleware.js');
const router = express.Router();

router.route('/').get(protect, getUsers);

module.exports = router;