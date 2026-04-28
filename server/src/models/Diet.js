const mongoose = require('mongoose');

/**
 * Diet Schema — tracks meals with calorie and macro breakdown.
 */
const dietSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    meal: {
      type: String,
      required: [true, 'Meal name is required'],
      trim: true,
    },
    calories: {
      type: Number,
      required: [true, 'Calories are required'],
      min: [0, 'Calories cannot be negative'],
    },
    protein: {
      type: Number,
      required: [true, 'Protein is required'],
      min: [0, 'Protein cannot be negative'],
    },
    carbs: {
      type: Number,
      required: [true, 'Carbs are required'],
      min: [0, 'Carbs cannot be negative'],
    },
    fats: {
      type: Number,
      required: [true, 'Fats are required'],
      min: [0, 'Fats cannot be negative'],
    },
    date: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Index for efficient querying by user and date
dietSchema.index({ user: 1, date: -1 });

module.exports = mongoose.model('Diet', dietSchema);
