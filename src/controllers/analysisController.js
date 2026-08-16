const axios = require('axios');
const Resume = require('../models/Resume');
const AnalysisResult = require('../models/AnalysisResult');
const { extractSkills } = require('../utils/textParser');

/**
 * Intelligent local fallback similarity matcher in case Python model is offline during local testing
 */
function localHeuristicMatcher(resumeText, jobDescription, extractedSkills) {
  const jobSkills = extractSkills(jobDescription);
  const lowerResume = resumeText.toLowerCase();
  const lowerJob = jobDescription.toLowerCase();

  const matched = [];
  const missing = [];

  // Match extracted skills from job
  jobSkills.forEach((skill) => {
    if (
      extractedSkills.map((s) => s.toLowerCase()).includes(skill.toLowerCase()) ||
      lowerResume.includes(skill.toLowerCase())
    ) {
      matched.push(skill);
    } else {
      missing.push(skill);
    }
  });

  // Calculate heuristic score
  let score = 50;
  if (jobSkills.length > 0) {
    score = Math.round((matched.length / jobSkills.length) * 100);
  } else {
    // Word overlap ratio
    const jobWords = new Set(
      lowerJob.split(/\W+/).filter((w) => w.length > 3)
    );
    const resumeWords = new Set(
      lowerResume.split(/\W+/).filter((w) => w.length > 3)
    );
    let common = 0;
    jobWords.forEach((w) => {
      if (resumeWords.has(w)) common++;
    });
    score = jobWords.size > 0 ? Math.min(100, Math.round((common / jobWords.size) * 100)) : 70;
  }

  // Ensure score is between 15 and 98 for realistic fallback feedback
  score = Math.max(15, Math.min(98, score));

  return {
    matchScore: score,
    matchedSkills: matched.length > 0 ? matched : extractedSkills.slice(0, 5),
    missingSkills: missing,
    feedback: `Analysis completed. Found ${matched.length} matching skills aligned with the job description.`,
  };
}

/**
 * @desc    Analyze resume against a job description via Python ML service
 * @route   POST /api/analyze
 * @access  Protected
 */
const analyzeResume = async (req, res, next) => {
  try {
    const { resumeId, jobDescription, jobId } = req.body;

    if (!resumeId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a resumeId.',
      });
    }

    if (!jobDescription || jobDescription.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a jobDescription to analyze against.',
      });
    }

    // 1. Fetch Resume from database
    const resume = await Resume.findById(resumeId);
    if (!resume) {
      return res.status(404).json({
        success: false,
        message: 'Resume not found.',
      });
    }

    // Ensure user owns this resume or is recruiter
    if (
      resume.userId.toString() !== req.user._id.toString() &&
      req.user.role !== 'recruiter'
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to analyze this resume.',
      });
    }

    let matchScore = 0;
    let matchedSkills = [];
    let missingSkills = [];
    let feedback = '';
    let usedModel = false;

    // 2. Call external Python microservice
    const modelServiceUrl = process.env.MODEL_SERVICE_URL;

    if (modelServiceUrl) {
      try {
        console.log(`🤖 Sending analysis request to Python model at: ${modelServiceUrl}`);
        const modelResponse = await axios.post(
          modelServiceUrl,
          {
            resumeText: resume.rawText,
            jobDescription: jobDescription,
            extractedSkills: resume.extractedSkills || [],
          },
          {
            timeout: 10000, // 10 second timeout
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        if (modelResponse.data) {
          matchScore = Number(modelResponse.data.matchScore) || 0;
          matchedSkills = Array.isArray(modelResponse.data.matchedSkills)
            ? modelResponse.data.matchedSkills
            : [];
          missingSkills = Array.isArray(modelResponse.data.missingSkills)
            ? modelResponse.data.missingSkills
            : [];
          feedback = modelResponse.data.feedback || modelResponse.data.message || '';
          usedModel = true;
        }
      } catch (modelError) {
        console.warn(
          `⚠️ Python Model service at ${modelServiceUrl} is unreachable (${modelError.message}). Using built-in heuristic analysis.`
        );
      }
    }

    // 3. Fallback heuristic if Python microservice was not reached
    if (!usedModel) {
      const fallbackResult = localHeuristicMatcher(
        resume.rawText,
        jobDescription,
        resume.extractedSkills || []
      );
      matchScore = fallbackResult.matchScore;
      matchedSkills = fallbackResult.matchedSkills;
      missingSkills = fallbackResult.missingSkills;
      feedback = fallbackResult.feedback;
    }

    // 4. Save to AnalysisResult collection
    const analysisResult = await AnalysisResult.create({
      resumeId: resume._id,
      jobId: jobId || null,
      jobDescription,
      matchScore,
      matchedSkills,
      missingSkills,
      feedback,
    });

    res.status(201).json({
      success: true,
      message: 'Resume analyzed successfully.',
      source: usedModel ? 'python_ml_model' : 'local_heuristic_engine',
      analysisResult: {
        id: analysisResult._id,
        resumeId: analysisResult.resumeId,
        jobId: analysisResult.jobId,
        matchScore: analysisResult.matchScore,
        matchedSkills: analysisResult.matchedSkills,
        missingSkills: analysisResult.missingSkills,
        feedback: analysisResult.feedback,
        createdAt: analysisResult.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get specific analysis result by ID
 * @route   GET /api/analyze/:id
 * @access  Protected
 */
const getAnalysisById = async (req, res, next) => {
  try {
    const analysis = await AnalysisResult.findById(req.params.id).populate('resumeId');

    if (!analysis) {
      return res.status(404).json({
        success: false,
        message: 'Analysis result not found.',
      });
    }

    res.status(200).json({
      success: true,
      analysis,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Suggest required skills from a job description using Python NER model + taxonomy
 * @route   POST /api/analyze/suggest-skills or POST /api/suggest-skills
 * @access  Public / Protected
 */
const suggestSkills = async (req, res, next) => {
  try {
    const jobDescription = req.body.jobDescription || req.body.job_description || '';
    const modelServiceUrl = process.env.MODEL_SERVICE_URL || 'http://127.0.0.1:8000/analyze';
    const suggestEndpoint = modelServiceUrl.replace('/analyze', '/suggest_skills');

    try {
      const response = await axios.post(
        suggestEndpoint,
        { job_description: jobDescription, jobDescription: jobDescription },
        { timeout: 8000 }
      );
      if (response.data && response.data.suggested_skills) {
        return res.status(200).json({
          success: true,
          suggested_skills: response.data.suggested_skills,
          extracted_from_ner: response.data.extracted_from_ner || [],
          message: response.data.message || 'Skills suggested successfully',
        });
      }
    } catch (modelErr) {
      console.warn('Python suggest_skills service unavailable, using local extraction fallback.');
    }

    // Local fallback extraction
    const extracted = extractSkills(jobDescription);
    const fallbackList = extracted.length > 0
      ? extracted
      : ['React', 'Node.js', 'JavaScript', 'HTML5', 'CSS3', 'Git'];

    res.status(200).json({
      success: true,
      suggested_skills: fallbackList,
      message: 'Skills extracted using heuristic engine.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  analyzeResume,
  getAnalysisById,
  suggestSkills,
};
