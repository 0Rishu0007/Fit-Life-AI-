const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Generate JWT token for a given user ID.
 */
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
};

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email',
      });
    }

    // Create user (password hashed by pre-save hook)
    const user = await User.create({ name, email, password });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        goals: user.goals,
        streak: user.streak,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error during registration',
      error: error.message,
    });
  }
};

/**
 * @route   POST /api/auth/login
 * @desc    Login user & return token
 * @access  Public
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user and include password for comparison
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Compare passwords
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const token = generateToken(user._id);

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        goals: user.goals,
        streak: user.streak,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error during login',
      error: error.message,
    });
  }
};

/**
 * @route   GET /api/auth/me
 * @desc    Get current logged-in user
 * @access  Private
 */
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        goals: user.goals,
        streak: user.streak,
        analyticsScore: user.analyticsScore,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

/**
 * @route   PUT /api/auth/goals
 * @desc    Update user goals
 * @access  Private
 */
const updateGoals = async (req, res) => {
  try {
    const { dailyCalories, dailyProtein, weeklyWorkouts, targetWeight } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        goals: {
          dailyCalories: dailyCalories || req.user.goals.dailyCalories,
          dailyProtein: dailyProtein || req.user.goals.dailyProtein,
          weeklyWorkouts: weeklyWorkouts || req.user.goals.weeklyWorkouts,
          targetWeight: targetWeight || req.user.goals.targetWeight,
        },
      },
      { new: true }
    );

    res.json({
      success: true,
      goals: user.goals,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update goals',
      error: error.message,
    });
  }
};

module.exports = { register, login, getMe, updateGoals };
