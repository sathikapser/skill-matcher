const express = require('express');
const router = express.Router();
const {
  uploadResume,
  getResumeById,
  getUserResumes,
  deleteResume,
  clearHistory,
  updateResume,
  searchResumesBySkill,
} = require('../controllers/resumeController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Protected Routes
const flexibleUpload = (req, res, next) => {
  const uploadHandler = upload.any();
  uploadHandler(req, res, (err) => {
    if (err) {
      return next(err);
    }
    if (req.files && req.files.length > 0) {
      req.file = req.files[0];
    }
    next();
  });
};

router.post('/upload', protect, flexibleUpload, uploadResume);
router.get('/', protect, getUserResumes);
router.get('/user/all', protect, getUserResumes);
router.get('/search', protect, searchResumesBySkill);
router.delete('/history/clear', protect, clearHistory);
router.delete('/clear_history/:userId', protect, clearHistory);
router.delete('/delete_resume/:id', protect, deleteResume);
router.get('/:id', protect, getResumeById);
router.put('/:id', protect, updateResume);
router.delete('/:id', protect, deleteResume);

module.exports = router;
