const express = require('express');
const { registerUser, loginUser } = require('../controllers/authController.js');
const { protect } = require('../middleware/authMiddleware.js'); 
const router = express.Router();


router.get('/me', protect, (req, res) => {
  res.status(200).json(req.user);
});

router.post('/register', registerUser);
router.post('/login', loginUser);

module.exports = router;