// const express = require('express');
// const { getMessages } = require('../controllers/messageController.js');
// const { protect } = require('../middleware/authMiddleware.js');
// const router = express.Router();

// router.route('/:id').get(protect, getMessages);

// module.exports = router;


const express = require('express');
const router = express.Router();
const { getMessages } = require('../controllers/messageController');
const { protect } = require('../middleware/authMiddleware');

// Protected route
router.get('/:id', protect, getMessages);

module.exports = router;
