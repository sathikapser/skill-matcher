/* ------------------------------------------------------------------
 * BACKEND CONFIG — Antigravity Express Backend URL (Port 5000)
 * ------------------------------------------------------------------ */
export const API_BASE_URL =
  (typeof import.meta !== "undefined" && import.meta.env?.["VITE_API_BASE_URL"]) ||
  "http://localhost:5000/api";

export const API_ROUTES = {
  signup: `${API_BASE_URL}/auth/signup`,
  login: `${API_BASE_URL}/auth/login`,
  me: `${API_BASE_URL}/auth/me`,
  upload: `${API_BASE_URL}/resume/upload`,
  analyze: `${API_BASE_URL}/analyze`,
  resumes: `${API_BASE_URL}/resume/user/all`,
  dashboard: `${API_BASE_URL}/dashboard`,
};
