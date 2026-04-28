const express = require('express');
const { getRecommendations } = require('../controllers/aiController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// GET /api/ai/recommendations (protected)
router.get('/recommendations', protect, getRecommendations);

module.exports = router;
