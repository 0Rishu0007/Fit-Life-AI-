const express = require('express');
const { body } = require('express-validator');
const {
  getDietEntries,
  getDailySummary,
  createDietEntry,
  updateDietEntry,
  deleteDietEntry,
} = require('../controllers/dietController');
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

const router = express.Router();

// All routes are protected
router.use(protect);

// GET /api/diet
router.get('/', getDietEntries);

// GET /api/diet/summary
router.get('/summary', getDailySummary);

// POST /api/diet
router.post(
  '/',
  [
    body('meal').trim().notEmpty().withMessage('Meal name is required'),
    body('calories').isFloat({ min: 0 }).withMessage('Calories must be a positive number'),
    body('protein').isFloat({ min: 0 }).withMessage('Protein must be a positive number'),
    body('carbs').isFloat({ min: 0 }).withMessage('Carbs must be a positive number'),
    body('fats').isFloat({ min: 0 }).withMessage('Fats must be a positive number'),
  ],
  validate,
  createDietEntry
);

// PUT /api/diet/:id
router.put('/:id', updateDietEntry);

// DELETE /api/diet/:id
router.delete('/:id', deleteDietEntry);

module.exports = router;
