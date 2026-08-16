const fs = require('fs');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

/**
 * Common tech skills dictionary for initial parsing & extraction
 */
const COMMON_SKILLS = [
  'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C#', 'Ruby', 'PHP', 'Go', 'Rust', 'Swift', 'Kotlin',
  'React', 'React.js', 'Next.js', 'Angular', 'Vue.js', 'Node.js', 'Express', 'Express.js', 'NestJS', 'Django',
  'Flask', 'FastAPI', 'Spring Boot', 'ASP.NET', 'GraphQL', 'REST API', 'HTML5', 'CSS3', 'Tailwind CSS', 'Bootstrap',
  'MongoDB', 'PostgreSQL', 'MySQL', 'SQLite', 'Redis', 'Firebase', 'Supabase', 'DynamoDB', 'Cassandra',
  'AWS', 'Azure', 'Google Cloud', 'GCP', 'Docker', 'Kubernetes', 'CI/CD', 'Git', 'GitHub', 'GitLab', 'Linux',
  'Machine Learning', 'Deep Learning', 'NLP', 'Computer Vision', 'PyTorch', 'TensorFlow', 'Scikit-Learn', 'Pandas',
  'NumPy', 'Data Analysis', 'Tableau', 'PowerBI', 'Hadoop', 'Spark', 'Kafka', 'Elasticsearch',
  'Agile', 'Scrum', 'Jira', 'Microservices', 'System Design', 'TDD', 'Unit Testing', 'Jest', 'Mocha', 'Cypress'
];

/**
 * Parse text from a PDF file buffer or path
 * @param {Buffer|string} source 
 * @returns {Promise<string>}
 */
async function parsePdf(source) {
  const dataBuffer = Buffer.isBuffer(source) ? source : fs.readFileSync(source);
  const data = await pdfParse(dataBuffer);
  return (data.text || '').trim();
}

/**
 * Parse text from a DOCX file buffer or path
 * @param {Buffer|string} source 
 * @returns {Promise<string>}
 */
async function parseDocx(source) {
  let result;
  if (Buffer.isBuffer(source)) {
    result = await mammoth.extractRawText({ buffer: source });
  } else {
    result = await mammoth.extractRawText({ path: source });
  }
  return (result.value || '').trim();
}

/**
 * Extract skills from raw text using keyword matching
 * @param {string} text 
 * @returns {string[]}
 */
function extractSkills(text) {
  if (!text) return [];
  const normalizedText = ` ${text.toLowerCase()} `;
  const matched = new Set();

  for (const skill of COMMON_SKILLS) {
    // Word boundary regex for exact matching
    const escaped = skill.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(`(^|[^a-zA-Z0-9#+])${escaped}([^a-zA-Z0-9#+]|$)`, 'i');
    if (regex.test(normalizedText)) {
      matched.add(skill);
    }
  }

  return Array.from(matched);
}

/**
 * Main parse entrypoint for a given file
 * @param {string} filePath 
 * @param {string} mimeType 
 * @param {string} originalName 
 * @returns {Promise<{ rawText: string, extractedSkills: string[] }>}
 */
async function parseResumeFile(filePath, mimeType, originalName = '') {
  let rawText = '';
  const lowerName = originalName.toLowerCase();

  if (mimeType === 'application/pdf' || lowerName.endsWith('.pdf')) {
    rawText = await parsePdf(filePath);
  } else if (
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    mimeType === 'application/msword' ||
    lowerName.endsWith('.docx')
  ) {
    rawText = await parseDocx(filePath);
  } else {
    throw new Error('Unsupported file format. Please upload a PDF or DOCX file.');
  }

  if (!rawText || rawText.length === 0) {
    // If text parser returned empty (e.g. image-only PDF), provide fallback indicator
    rawText = `[File uploaded: ${originalName} - No selectable text extracted. Text may be an image/scan.]`;
  }

  const extractedSkills = extractSkills(rawText);

  return {
    rawText,
    extractedSkills,
  };
}

module.exports = {
  parsePdf,
  parseDocx,
  extractSkills,
  parseResumeFile,
};
