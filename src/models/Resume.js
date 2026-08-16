const mongoose = require('mongoose');

const resumeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    fileName: {
      type: String,
      required: true,
    },
    fileUrl: {
      type: String,
      required: true,
    },
    fileType: {
      type: String,
      enum: ['pdf', 'docx', 'application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
      default: 'pdf',
    },
    fileSize: {
      type: Number,
    },
    rawText: {
      type: String,
      required: [true, 'Extracted resume text is required'],
    },
    extractedSkills: {
      type: [String],
      default: [],
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Resume', resumeSchema);
