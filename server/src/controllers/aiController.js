const axios = require('axios');
const Workout = require('../models/Workout');
const Diet = require('../models/Diet');

/**
 * @route   GET /api/ai/recommendations
 * @desc    Get AI-powered recommendations based on user's workout & diet data
 * @access  Private
 */
const getRecommendations = async (req, res) => {
  try {
    // Fetch last 30 days of user data
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [workouts, dietEntries] = await Promise.all([
      Workout.find({
        user: req.user._id,
        date: { $gte: thirtyDaysAgo },
      }).sort({ date: -1 }),
      Diet.find({
        user: req.user._id,
        date: { $gte: thirtyDaysAgo },
      }).sort({ date: -1 }),
    ]);

    // Prepare payload for AI service
    const payload = {
      user: {
        goals: req.user.goals,
        streak: req.user.streak,
      },
      workouts: workouts.map((w) => ({
        exercise: w.exercise,
        sets: w.sets,
        reps: w.reps,
        weight: w.weight,
        date: w.date,
      })),
      diet: dietEntries.map((d) => ({
        meal: d.meal,
        calories: d.calories,
        protein: d.protein,
        carbs: d.carbs,
        fats: d.fats,
        date: d.date,
      })),
    };

    // Call AI microservice
    const aiUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
    const response = await axios.post(`${aiUrl}/recommend`, payload, {
      timeout: 10000,
    });

    res.json({
      success: true,
      data: response.data,
    });
  } catch (error) {
    // If AI service is down, return a graceful fallback
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      return res.status(503).json({
        success: false,
        message: 'AI service is currently unavailable. Please try again later.',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to get AI recommendations',
      error: error.message,
    });
  }
};

module.exports = { getRecommendations };
