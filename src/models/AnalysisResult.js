const mongoose = require('mongoose');

const analysisResultSchema = new mongoose.Schema(
  {
    resumeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Resume',
      required: [true, 'Resume ID is required'],
      index: true,
    },
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'JobPosting',
      default: null,
    },
    jobDescription: {
      type: String,
      default: '',
    },
    matchScore: {
      type: Number,
      required: [true, 'Match score is required'],
      min: 0,
      max: 100,
    },
    matchedSkills: {
      type: [String],
      default: [],
    },
    missingSkills: {
      type: [String],
      default: [],
    },
    recommendations: {
      type: [String],
      default: [],
    },
    feedback: {
      type: String,
      default: '',
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('AnalysisResult', analysisResultSchema);
