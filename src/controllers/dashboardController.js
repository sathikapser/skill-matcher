const Resume = require('../models/Resume');
const AnalysisResult = require('../models/AnalysisResult');
const User = require('../models/User');

/**
 * @desc    Get dashboard data for a user (resumes + latest analysis for each)
 * @route   GET /api/dashboard/:userId or GET /api/dashboard
 * @access  Protected
 */
const getDashboardData = async (req, res, next) => {
  try {
    // If userId param is passed, use it; otherwise use authenticated user's ID
    const targetUserId = req.params.userId || req.user._id;

    // Verify user authorization: user can only see their own dashboard unless they are recruiter/admin
    if (
      targetUserId.toString() !== req.user._id.toString() &&
      req.user.role !== 'recruiter'
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this user dashboard.',
      });
    }

    // 1. Fetch user info
    const user = await User.findById(targetUserId).select('name email role createdAt');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    // 2. Fetch all resumes for this user
    const resumes = await Resume.find({ userId: targetUserId }).sort({ createdAt: -1 });

    // 3. For each resume, fetch the latest AnalysisResult
    const resumeIds = resumes.map((r) => r._id);
    const analysisResults = await AnalysisResult.find({
      resumeId: { $in: resumeIds },
    }).sort({ createdAt: -1 });

    // Group latest analysis per resume
    const latestAnalysisMap = new Map();
    analysisResults.forEach((analysis) => {
      const key = analysis.resumeId.toString();
      if (!latestAnalysisMap.has(key)) {
        latestAnalysisMap.set(key, analysis);
      }
    });

    // Merge resumes with their latest analysis
    const resumesWithAnalysis = resumes.map((resume) => {
      const latestAnalysis = latestAnalysisMap.get(resume._id.toString()) || null;
      return {
        _id: resume._id,
        fileName: resume.fileName,
        fileUrl: resume.fileUrl,
        fileType: resume.fileType,
        fileSize: resume.fileSize,
        extractedSkills: resume.extractedSkills,
        uploadedAt: resume.uploadedAt,
        createdAt: resume.createdAt,
        latestAnalysis: latestAnalysis
          ? {
              id: latestAnalysis._id,
              matchScore: latestAnalysis.matchScore,
              matchedSkills: latestAnalysis.matchedSkills,
              missingSkills: latestAnalysis.missingSkills,
              feedback: latestAnalysis.feedback,
              createdAt: latestAnalysis.createdAt,
            }
          : null,
      };
    });

    // Compute summary metrics
    const totalResumes = resumes.length;
    const scores = resumesWithAnalysis
      .filter((r) => r.latestAnalysis && typeof r.latestAnalysis.matchScore === 'number')
      .map((r) => r.latestAnalysis.matchScore);

    const averageMatchScore =
      scores.length > 0
        ? Math.round(scores.reduce((acc, curr) => acc + curr, 0) / scores.length)
        : 0;

    // Collect all unique extracted skills
    const allSkills = new Set();
    resumes.forEach((r) => {
      (r.extractedSkills || []).forEach((skill) => allSkills.add(skill));
    });

    res.status(200).json({
      success: true,
      user,
      metrics: {
        totalResumes,
        analyzedResumesCount: scores.length,
        averageMatchScore,
        uniqueSkillsCount: allSkills.size,
      },
      skillsSummary: Array.from(allSkills),
      resumes: resumesWithAnalysis,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardData,
};
