const mongoose = require('mongoose');

/**
 * Workout Schema — tracks individual workout entries with exercise details.
 */
const workoutSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    exercise: {
      type: String,
      required: [true, 'Exercise name is required'],
      trim: true,
    },
    sets: {
      type: Number,
      required: [true, 'Number of sets is required'],
      min: [1, 'Sets must be at least 1'],
    },
    reps: {
      type: Number,
      required: [true, 'Number of reps is required'],
      min: [1, 'Reps must be at least 1'],
    },
    weight: {
      type: Number,
      required: [true, 'Weight is required'],
      min: [0, 'Weight cannot be negative'],
    },
    date: {
      type: Date,
      default: Date.now,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
    },
  },
  { timestamps: true }
);

// Index for efficient querying by user and date
workoutSchema.index({ user: 1, date: -1 });

module.exports = mongoose.model('Workout', workoutSchema);
