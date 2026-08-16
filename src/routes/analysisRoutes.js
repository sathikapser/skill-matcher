const express = require('express');
const router = express.Router();
const {
  analyzeResume,
  getAnalysisById,
  suggestSkills,
} = require('../controllers/analysisController');
const { protect } = require('../middleware/auth');

// Public / Protected routes
router.post('/suggest-skills', suggestSkills);
router.post('/suggest_skills', suggestSkills);
router.post('/', protect, analyzeResume);
router.get('/:id', protect, getAnalysisById);

module.exports = router;
