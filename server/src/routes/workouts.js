const express = require('express');
const { body } = require('express-validator');
const {
  getWorkouts,
  createWorkout,
  updateWorkout,
  deleteWorkout,
} = require('../controllers/workoutController');
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

const router = express.Router();

// All routes are protected
router.use(protect);

// GET /api/workouts
router.get('/', getWorkouts);

// POST /api/workouts
router.post(
  '/',
  [
    body('exercise').trim().notEmpty().withMessage('Exercise name is required'),
    body('sets').isInt({ min: 1 }).withMessage('Sets must be at least 1'),
    body('reps').isInt({ min: 1 }).withMessage('Reps must be at least 1'),
    body('weight').isFloat({ min: 0 }).withMessage('Weight must be a positive number'),
  ],
  validate,
  createWorkout
);

// PUT /api/workouts/:id
router.put('/:id', updateWorkout);

// DELETE /api/workouts/:id
router.delete('/:id', deleteWorkout);

module.exports = router;
