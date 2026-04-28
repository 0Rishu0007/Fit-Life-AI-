const Diet = require('../models/Diet');

/**
 * @route   GET /api/diet
 * @desc    Get all diet entries for logged-in user
 * @access  Private
 */
const getDietEntries = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const query = { user: req.user._id };

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const entries = await Diet.find(query).sort({ date: -1 });

    res.json({
      success: true,
      count: entries.length,
      data: entries,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch diet entries',
      error: error.message,
    });
  }
};

/**
 * @route   GET /api/diet/summary
 * @desc    Get daily diet summary (aggregated calories & macros)
 * @access  Private
 */
const getDailySummary = async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const summary = await Diet.aggregate([
      {
        $match: {
          user: req.user._id,
          date: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$date' },
          },
          totalCalories: { $sum: '$calories' },
          totalProtein: { $sum: '$protein' },
          totalCarbs: { $sum: '$carbs' },
          totalFats: { $sum: '$fats' },
          mealCount: { $sum: 1 },
        },
      },
      { $sort: { _id: -1 } },
    ]);

    res.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch diet summary',
      error: error.message,
    });
  }
};

/**
 * @route   POST /api/diet
 * @desc    Create a new diet entry
 * @access  Private
 */
const createDietEntry = async (req, res) => {
  try {
    const { meal, calories, protein, carbs, fats, date } = req.body;

    const entry = await Diet.create({
      user: req.user._id,
      meal,
      calories,
      protein,
      carbs,
      fats,
      date: date || Date.now(),
    });

    res.status(201).json({
      success: true,
      data: entry,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create diet entry',
      error: error.message,
    });
  }
};

/**
 * @route   PUT /api/diet/:id
 * @desc    Update a diet entry
 * @access  Private
 */
const updateDietEntry = async (req, res) => {
  try {
    let entry = await Diet.findById(req.params.id);

    if (!entry) {
      return res.status(404).json({
        success: false,
        message: 'Diet entry not found',
      });
    }

    if (entry.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this entry',
      });
    }

    entry = await Diet.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.json({
      success: true,
      data: entry,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update diet entry',
      error: error.message,
    });
  }
};

/**
 * @route   DELETE /api/diet/:id
 * @desc    Delete a diet entry
 * @access  Private
 */
const deleteDietEntry = async (req, res) => {
  try {
    const entry = await Diet.findById(req.params.id);

    if (!entry) {
      return res.status(404).json({
        success: false,
        message: 'Diet entry not found',
      });
    }

    if (entry.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this entry',
      });
    }

    await Diet.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Diet entry deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete diet entry',
      error: error.message,
    });
  }
};

module.exports = {
  getDietEntries,
  getDailySummary,
  createDietEntry,
  updateDietEntry,
  deleteDietEntry,
};
