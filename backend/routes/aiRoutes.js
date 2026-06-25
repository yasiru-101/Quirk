const express = require('express');
const { protect } = require('../middleware/auth');
const aiController = require('../controllers/aiController');

const router = express.Router();

// Require authentication for AI chat
router.post('/chat', protect, aiController.handleChat);

module.exports = router;
