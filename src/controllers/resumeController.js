const path = require('path');
const fs = require('fs');
const Resume = require('../models/Resume');
const AnalysisResult = require('../models/AnalysisResult');
const { parseResumeFile } = require('../utils/textParser');

/**
 * @desc    Upload & parse resume (PDF / DOCX)
 * @route   POST /api/resume/upload
 * @access  Protected
 */
const uploadResume = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a resume file (PDF or DOCX).',
      });
    }

    const file = req.file;
    const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
    const fileUrl = `${baseUrl}/uploads/${file.filename}`;

    // Parse text and extract skills
    const { rawText, extractedSkills } = await parseResumeFile(
      file.path,
      file.mimetype,
      file.originalname
    );

    // Save to database
    const resume = await Resume.create({
      userId: req.user._id,
      fileName: file.originalname,
      fileUrl,
      fileType: file.mimetype,
      fileSize: file.size,
      rawText,
      extractedSkills,
    });

    res.status(201).json({
      success: true,
      message: 'Resume uploaded and parsed successfully.',
      resume,
    });
  } catch (error) {
    // If an error occurs, clean up uploaded file if it exists
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (cleanupErr) {
        console.error('Error cleaning up file:', cleanupErr);
      }
    }
    next(error);
  }
};

/**
 * @desc    Get single resume by ID
 * @route   GET /api/resume/:id
 * @access  Protected
 */
const getResumeById = async (req, res, next) => {
  try {
    const resume = await Resume.findById(req.params.id);

    if (!resume) {
      return res.status(404).json({
        success: false,
        message: 'Resume not found.',
      });
    }

    // Ensure the requester owns the resume or is a recruiter
    if (
      resume.userId.toString() !== req.user._id.toString() &&
      req.user.role !== 'recruiter'
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this resume.',
      });
    }

    res.status(200).json({
      success: true,
      resume,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all resumes for logged-in user
 * @route   GET /api/resume/user/all
 * @access  Protected
 */
const getUserResumes = async (req, res, next) => {
  try {
    const resumes = await Resume.find({ userId: req.user._id }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      count: resumes.length,
      resumes,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a resume
 * @route   DELETE /api/resume/:id
 * @access  Protected
 */
const deleteResume = async (req, res, next) => {
  try {
    const resume = await Resume.findById(req.params.id);

    if (!resume) {
      return res.status(404).json({
        success: false,
        message: 'Resume not found.',
      });
    }

    if (
      resume.userId.toString() !== req.user._id.toString() &&
      req.user.role !== 'recruiter'
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this resume.',
      });
    }

    // Try deleting local file
    try {
      const fileName = path.basename(resume.fileUrl);
      const filePath = path.join(process.cwd(), 'uploads', fileName);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (fileErr) {
      console.warn('Could not delete local file:', fileErr.message);
    }

    // Delete associated analysis results
    await AnalysisResult.deleteMany({ resumeId: resume._id });

    // Delete resume record
    await resume.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Resume and associated analysis results deleted.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Clear all upload history for the authenticated user
 * @route   DELETE /api/resume/history/clear or DELETE /api/resume/clear_history/:userId
 * @access  Protected
 */
const clearHistory = async (req, res, next) => {
  try {
    const targetUserId = req.params.userId || req.user._id;

    if (
      targetUserId.toString() !== req.user._id.toString() &&
      req.user.role !== 'recruiter'
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to clear this history.',
      });
    }

    const resumes = await Resume.find({ userId: targetUserId });
    const resumeIds = resumes.map((r) => r._id);

    // Clean up local files
    for (const resume of resumes) {
      try {
        const fileName = path.basename(resume.fileUrl);
        const filePath = path.join(process.cwd(), 'uploads', fileName);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (err) {
        console.warn('Error deleting local file:', err.message);
      }
    }

    // Delete associated analyses and resumes
    await AnalysisResult.deleteMany({ resumeId: { $in: resumeIds } });
    const deleteResult = await Resume.deleteMany({ userId: targetUserId });

    res.status(200).json({
      success: true,
      message: `Successfully cleared ${deleteResult.deletedCount} resume(s) and their analysis history.`,
      deletedCount: deleteResult.deletedCount,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update/Alter resume record (e.g. edit name, raw text, skills)
 * @route   PUT /api/resume/:id
 * @access  Protected
 */
const updateResume = async (req, res, next) => {
  try {
    const { fileName, rawText, extractedSkills } = req.body;
    let resume = await Resume.findById(req.params.id);

    if (!resume) {
      return res.status(404).json({
        success: false,
        message: 'Resume not found.',
      });
    }

    if (
      resume.userId.toString() !== req.user._id.toString() &&
      req.user.role !== 'recruiter'
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to modify this resume.',
      });
    }

    if (fileName) resume.fileName = fileName.trim();
    if (rawText) resume.rawText = rawText;
    if (Array.isArray(extractedSkills)) resume.extractedSkills = extractedSkills;

    await resume.save();

    res.status(200).json({
      success: true,
      message: 'Resume updated successfully.',
      resume,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Search resumes by skill (Recruiter Feature)
 * @route   GET /api/resume/search?skill=React
 * @access  Protected
 */
const searchResumesBySkill = async (req, res, next) => {
  try {
    const { skill, query } = req.query;
    const filter = {};

    if (skill) {
      filter.extractedSkills = { $regex: new RegExp(skill, 'i') };
    } else if (query) {
      filter.$or = [
        { fileName: { $regex: new RegExp(query, 'i') } },
        { rawText: { $regex: new RegExp(query, 'i') } },
        { extractedSkills: { $regex: new RegExp(query, 'i') } },
      ];
    }

    const resumes = await Resume.find(filter).populate('userId', 'name email').sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: resumes.length,
      resumes,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  uploadResume,
  getResumeById,
  getUserResumes,
  deleteResume,
  clearHistory,
  updateResume,
  searchResumesBySkill,
};
