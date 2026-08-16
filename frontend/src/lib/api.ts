import { API_BASE_URL } from "@/config";

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

export interface Resume {
  _id: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize?: number;
  rawText?: string;
  extractedSkills: string[];
  uploadedAt: string;
  createdAt: string;
  latestAnalysis?: {
    id: string;
    matchScore: number;
    matchedSkills: string[];
    missingSkills: string[];
    feedback: string;
    createdAt: string;
  } | null;
}

export interface AnalysisResult {
  id: string;
  resumeId: string;
  jobId?: string;
  matchScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  feedback: string;
  createdAt: string;
}

export interface DashboardResponse {
  success: boolean;
  user: User;
  metrics: {
    totalResumes: number;
    analyzedResumesCount: number;
    averageMatchScore: number;
    uniqueSkillsCount: number;
  };
  skillsSummary: string[];
  resumes: Resume[];
}

/**
 * Helper to get authorization headers
 */
export function getAuthHeaders(isMultipart = false): HeadersInit {
  const headers: Record<string, string> = {};
  if (!isMultipart) {
    headers["Content-Type"] = "application/json";
  }
  const token = localStorage.getItem("token");
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

/**
 * Authentication: Signup
 */
export async function apiSignup(name: string, email: string, password: string, role: string = "user") {
  const res = await fetch(`${API_BASE_URL}/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password, role }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || "Failed to sign up");
  }
  if (data.token) {
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
  }
  return data;
}

/**
 * Authentication: Login
 */
export async function apiLogin(email: string, password: string) {
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || "Failed to log in");
  }
  if (data.token) {
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
  }
  return data;
}

/**
 * Authentication: Logout
 */
export function apiLogout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}

/**
 * Authentication: Get current user
 */
export async function apiGetMe() {
  const res = await fetch(`${API_BASE_URL}/auth/me`, {
    method: "GET",
    headers: getAuthHeaders(),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || "Failed to fetch user profile");
  }
  return data.user;
}

/**
 * Resume: Upload PDF/DOCX
 */
export async function apiUploadResume(file: File): Promise<Resume> {
  const formData = new FormData();
  formData.append("resume", file);

  const res = await fetch(`${API_BASE_URL}/resume/upload`, {
    method: "POST",
    headers: getAuthHeaders(true),
    body: formData,
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || "Failed to upload resume");
  }
  return data.resume;
}

/**
 * Resume: Analyze Resume against Job Description
 */
export async function apiAnalyzeResume(
  resumeId: string,
  jobDescription: string
): Promise<{ source: string; analysisResult: AnalysisResult }> {
  const res = await fetch(`${API_BASE_URL}/analyze`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ resumeId, jobDescription }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || "Failed to analyze resume");
  }
  return {
    source: data.source,
    analysisResult: data.analysisResult,
  };
}

/**
 * Resume: Fetch all user resumes
 */
export async function apiGetMyResumes(): Promise<Resume[]> {
  const res = await fetch(`${API_BASE_URL}/resume/user/all`, {
    method: "GET",
    headers: getAuthHeaders(),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || "Failed to fetch resumes");
  }
  return data.resumes || [];
}

/**
 * Dashboard: Fetch full dashboard aggregation
 */
export async function apiGetDashboard(): Promise<DashboardResponse> {
  const res = await fetch(`${API_BASE_URL}/dashboard`, {
    method: "GET",
    headers: getAuthHeaders(),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || "Failed to fetch dashboard data");
  }
  return data;
}

/**
 * Resume: Delete a single resume by ID
 */
export async function apiDeleteResume(resumeId: string): Promise<boolean> {
  const res = await fetch(`${API_BASE_URL}/resume/${resumeId}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || "Failed to delete resume");
  }
  return true;
}

/**
 * Resume: Clear all upload history
 */
export async function apiClearHistory(userId?: string): Promise<{ deletedCount: number }> {
  const endpoint = userId
    ? `${API_BASE_URL}/resume/clear_history/${userId}`
    : `${API_BASE_URL}/resume/history/clear`;
  const res = await fetch(endpoint, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || "Failed to clear upload history");
  }
  return { deletedCount: data.deletedCount || 0 };
}

/**
 * Resume: Update/Alter a resume record
 */
export async function apiUpdateResume(
  resumeId: string,
  updates: { fileName?: string; rawText?: string; extractedSkills?: string[] }
): Promise<Resume> {
  const res = await fetch(`${API_BASE_URL}/resume/${resumeId}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(updates),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || "Failed to update resume");
  }
  return data.resume;
}

/**
 * AI Skills: Suggest required skills for a job description
 */
export async function apiSuggestSkills(jobDescription: string): Promise<string[]> {
  const res = await fetch(`${API_BASE_URL}/analyze/suggest-skills`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jobDescription, job_description: jobDescription }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || "Failed to suggest skills");
  }
  return data.suggested_skills || [];
}

/**
 * Resume: Search resumes by skill or keyword (Recruiter tool)
 */
export async function apiSearchResumes(query: string): Promise<Resume[]> {
  const res = await fetch(`${API_BASE_URL}/resume/search?query=${encodeURIComponent(query)}`, {
    method: "GET",
    headers: getAuthHeaders(),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || "Failed to search resumes");
  }
  return data.resumes || [];
}
