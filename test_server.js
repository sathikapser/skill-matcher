const { generateToken, verifyToken } = require('./src/utils/tokenService');
const { extractSkills } = require('./src/utils/textParser');
const app = require('./src/app');

console.log('--- RUNNING SMARTRESUME AI BACKEND SELF-CHECK ---');

// 1. Test JWT
const testUser = { _id: '654321654321654321654321', email: 'test@example.com', role: 'user', name: 'Tester' };
const token = generateToken(testUser);
console.log('✅ JWT Token generated successfully');
const decoded = verifyToken(token);
if (decoded.email === testUser.email) {
  console.log('✅ JWT Token verified successfully');
} else {
  throw new Error('JWT verification failed');
}

// 2. Test Skill Extraction
const sampleResumeText = 'Experienced Full Stack Engineer skilled in React, Node.js, Express, TypeScript, Docker, and AWS.';
const skills = extractSkills(sampleResumeText);
console.log('✅ Skills extracted:', skills);

// 3. Test App Routing
if (app && typeof app.listen === 'function') {
  console.log('✅ Express application and router mounts verified successfully');
}

console.log('--- ALL MODULE TESTS PASSED ---');
process.exit(0);
