# 🚀 SmartResume AI - Backend API

Production-ready backend for **SmartResume AI** built with Node.js, Express, MongoDB (Mongoose), JWT Authentication, Multer file parsing (PDF & DOCX), and an AI model integration layer.

---

## 📁 Project Structure

```
Ai resume/
├── src/
│   ├── config/
│   │   └── db.js                 # MongoDB connection using Mongoose
│   ├── models/
│   │   ├── User.js               # User model (name, email, passwordHash, role, timestamps)
│   │   ├── Resume.js             # Resume model (userId, fileUrl, rawText, extractedSkills, etc.)
│   │   ├── JobPosting.js         # JobPosting model (title, description, requiredSkills)
│   │   └── AnalysisResult.js     # AnalysisResult model (resumeId, matchScore, matchedSkills, feedback)
│   ├── middleware/
│   │   ├── auth.js               # JWT verification & role authorization (protect, authorize)
│   │   ├── upload.js             # Multer config for PDF/DOCX parsing & storage
│   │   └── errorHandler.js       # Centralized error handler with Mongoose & Multer support
│   ├── utils/
│   │   ├── textParser.js         # PDF (pdf-parse) and DOCX (mammoth) text extraction & skill heuristics
│   │   └── tokenService.js       # JWT signing & verification helpers
│   ├── controllers/
│   │   ├── authController.js     # Signup, Login, Me handlers
│   │   ├── resumeController.js   # Upload resume, parse text, get resume by ID, list resumes, delete
│   │   ├── analysisController.js # Call Python microservice with fallback heuristic & store result
│   │   └── dashboardController.js# Aggregate user resumes + latest analysis metrics
│   ├── routes/
│   │   ├── authRoutes.js         # /api/auth (signup, login, me)
│   │   ├── resumeRoutes.js       # /api/resume (upload, user/all, :id)
│   │   ├── analysisRoutes.js     # /api/analyze (post, :id)
│   │   └── dashboardRoutes.js    # /api/dashboard, /api/dashboard/:userId
│   └── app.js                    # Express app configuration & CORS setup
├── uploads/                      # Local resume storage directory
├── .env.example                  # Environment variable template
├── .env                          # Local environment variables
├── package.json                  # Dependencies & scripts
├── python_model_service.py       # Standalone FastAPI Python model bridge server
├── smartresume_postman_collection.json # Exportable Postman collection
└── test_server.js                # Self-check test script
```

---

## ⚡ Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env` and set your MongoDB URI:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/smartresume
JWT_SECRET=super_secret_jwt_key_smartresume_ai_2026
JWT_EXPIRES_IN=7d
MODEL_SERVICE_URL=http://127.0.0.1:8000/analyze
CORS_ORIGIN=*
```

### 3. Run the Backend Server
```bash
# Development mode (with auto-reload)
npm run dev

# Or production start
npm start
```

The server starts at `http://localhost:5000`.

---

## 📡 API Reference

### 🔐 Authentication (`/api/auth`)
| Method | Endpoint | Protection | Description | Body |
|---|---|---|---|---|
| `POST` | `/api/auth/signup` | Public | Register new user or recruiter | `{ "name": "Jane", "email": "jane@example.com", "password": "password123", "role": "user" }` |
| `POST` | `/api/auth/login` | Public | Log in and receive JWT token | `{ "email": "jane@example.com", "password": "password123" }` |
| `GET` | `/api/auth/me` | Protected | Get profile of logged-in user | None (`Authorization: Bearer <token>`) |

### 📄 Resume Management (`/api/resume`)
| Method | Endpoint | Protection | Description | Payload |
|---|---|---|---|---|
| `POST` | `/api/resume/upload` | Protected | Upload PDF/DOCX, parse text, extract skills, save to DB | `multipart/form-data` with `resume` (or `file`) field |
| `GET` | `/api/resume/user/all` | Protected | Fetch all resumes uploaded by the logged-in user | None |
| `GET` | `/api/resume/:id` | Protected | Fetch single resume details by ID | None |
| `DELETE` | `/api/resume/:id` | Protected | Delete resume and associated analysis results | None |

### 🤖 Analysis (`/api/analyze`)
| Method | Endpoint | Protection | Description | Body |
|---|---|---|---|---|
| `POST` | `/api/analyze` | Protected | Sends resume text & job description to Python model, saves result | `{ "resumeId": "<id>", "jobDescription": "Job text here..." }` |
| `GET` | `/api/analyze/:id` | Protected | Get analysis result by ID | None |

### 📊 Dashboard (`/api/dashboard`)
| Method | Endpoint | Protection | Description |
|---|---|---|---|
| `GET` | `/api/dashboard` | Protected | Aggregates all resumes, latest match scores, average score, and skill breakdown for the current user |
| `GET` | `/api/dashboard/:userId` | Protected | Dashboard for specific user ID (recruiter or self) |

---

## 🧪 Testing with Postman

1. Open **Postman**.
2. Click **Import** and select `smartresume_postman_collection.json`.
3. The collection is pre-configured with automated test scripts that automatically save your `jwtToken`, `userId`, and `resumeId` into environment variables as you run the requests in order:
   - **0. Health Check** → Verify API is running
   - **1. Signup** → Generates account & stores JWT token
   - **2. Login** → Logs in & stores JWT token
   - **3. Me** → Checks user profile
   - **4. Upload Resume** → Select any `.pdf` or `.docx` file in the `form-data` tab
   - **5. Analyze** → Runs AI match on the uploaded resume against a job description
   - **6. Dashboard** → Loads summary metrics and parsed results
