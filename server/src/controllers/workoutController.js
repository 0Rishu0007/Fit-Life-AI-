const Workout = require('../models/Workout');
const User = require('../models/User');

/**
 * @route   GET /api/workouts
 * @desc    Get all workouts for logged-in user (with optional date filtering)
 * @access  Private
 */
const getWorkouts = async (req, res) => {
  try {
    const { startDate, endDate, exercise } = req.query;
    const query = { user: req.user._id };

    // Optional date range filtering
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    // Optional exercise name filtering
    if (exercise) {
      query.exercise = { $regex: exercise, $options: 'i' };
    }

    const workouts = await Workout.find(query).sort({ date: -1 });

    res.json({
      success: true,
      count: workouts.length,
      data: workouts,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch workouts',
      error: error.message,
    });
  }
};

/**
 * @route   POST /api/workouts
 * @desc    Create a new workout entry
 * @access  Private
 */
const createWorkout = async (req, res) => {
  try {
    const { exercise, sets, reps, weight, date, notes } = req.body;

    const workout = await Workout.create({
      user: req.user._id,
      exercise,
      sets,
      reps,
      weight,
      date: date || Date.now(),
      notes,
    });

    // Update user streak
    await updateStreak(req.user._id);

    res.status(201).json({
      success: true,
      data: workout,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create workout',
      error: error.message,
    });
  }
};

/**
 * @route   PUT /api/workouts/:id
 * @desc    Update a workout entry
 * @access  Private
 */
const updateWorkout = async (req, res) => {
  try {
    let workout = await Workout.findById(req.params.id);

    if (!workout) {
      return res.status(404).json({
        success: false,
        message: 'Workout not found',
      });
    }

    // Ensure user owns this workout
    if (workout.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this workout',
      });
    }

    workout = await Workout.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.json({
      success: true,
      data: workout,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update workout',
      error: error.message,
    });
  }
};

/**
 * @route   DELETE /api/workouts/:id
 * @desc    Delete a workout entry
 * @access  Private
 */
const deleteWorkout = async (req, res) => {
  try {
    const workout = await Workout.findById(req.params.id);

    if (!workout) {
      return res.status(404).json({
        success: false,
        message: 'Workout not found',
      });
    }

    // Ensure user owns this workout
    if (workout.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this workout',
      });
    }

    await Workout.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Workout deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete workout',
      error: error.message,
    });
  }
};

/**
 * Update the user's workout streak based on activity dates.
 */
const updateStreak = async (userId) => {
  try {
    const user = await User.findById(userId);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lastActivity = user.streak.lastActivityDate
      ? new Date(user.streak.lastActivityDate)
      : null;

    if (lastActivity) {
      lastActivity.setHours(0, 0, 0, 0);
      const diffDays = Math.floor((today - lastActivity) / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        // Consecutive day — increment streak
        user.streak.current += 1;
      } else if (diffDays > 1) {
        // Streak broken — reset
        user.streak.current = 1;
      }
      // diffDays === 0: same day, don't change streak
    } else {
      // First activity ever
      user.streak.current = 1;
    }

    // Update longest streak
    if (user.streak.current > user.streak.longest) {
      user.streak.longest = user.streak.current;
    }

    user.streak.lastActivityDate = today;
    await user.save();
  } catch (error) {
    console.error('Streak update error:', error.message);
  }
};

module.exports = { getWorkouts, createWorkout, updateWorkout, deleteWorkout };
