import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useRef, useState, useEffect, type DragEvent } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { apiUploadResume, apiAnalyzeResume, apiSuggestSkills, Resume, AnalysisResult } from "@/lib/api";

export const Route = createFileRoute("/upload")({
  head: () => ({
    meta: [
      { title: "Upload Resume — SmartResume AI" },
      { name: "description", content: "Drag and drop a PDF or DOCX resume, paste a job description and get an instant skill match score." },
      { property: "og:title", content: "Upload Resume — SmartResume AI" },
      { property: "og:description", content: "Drop a PDF or DOCX resume, paste a job description, get an instant match score." },
    ],
  }),
  component: UploadPage,
});

const ACCEPTED = [".pdf", ".docx"];

function UploadPage() {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploadedResume, setUploadedResume] = useState<Resume | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [jobDescription, setJobDescription] = useState("");
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [modelSource, setModelSource] = useState<string | null>(null);

  // Auth guard check
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate({ to: "/login" });
    }
  }, [navigate]);

  const handleUpload = (selected: File | null | undefined) => {
    if (!selected) return;
    const ok = ACCEPTED.some((ext) => selected.name.toLowerCase().endsWith(ext));
    if (!ok) {
      setError("Only PDF and DOCX files are supported.");
      setFile(null);
      return;
    }
    setError(null);
    setFile(selected);
    setUploadedResume(null);
    setResult(null);
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    handleUpload(e.dataTransfer.files?.[0]);
  };

  const handleAnalyze = async () => {
    if (!file && !uploadedResume) {
      setError("Please add a resume first.");
      return;
    }

    if (!jobDescription.trim()) {
      setError("Please paste a job description to match against.");
      return;
    }

    setError(null);
    setAnalyzing(true);
    setResult(null);

    try {
      // 1. Upload resume to backend if not already uploaded
      let currentResume = uploadedResume;
      if (!currentResume && file) {
        setUploading(true);
        currentResume = await apiUploadResume(file);
        setUploadedResume(currentResume);
        setUploading(false);
      }

      if (!currentResume?._id) {
        throw new Error("Could not process resume upload.");
      }

      // 2. Call AI analyze endpoint
      const analysisData = await apiAnalyzeResume(currentResume._id, jobDescription);
      setResult(analysisData.analysisResult);
      setModelSource(analysisData.source);
    } catch (err: any) {
      setError(err.message || "An error occurred during analysis.");
    } finally {
      setAnalyzing(false);
      setUploading(false);
    }
  };

  const [suggestedSkills, setSuggestedSkills] = useState<string[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  const handleSuggestSkills = async () => {
    if (!jobDescription.trim()) {
      setError("Please paste a job description first to suggest skills.");
      return;
    }
    setLoadingSuggestions(true);
    try {
      const skills = await apiSuggestSkills(jobDescription);
      setSuggestedSkills(skills);
    } catch (err: any) {
      console.warn("Could not fetch skill suggestions:", err);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  return (
    <DashboardLayout title="Upload Resume" subtitle="Match a resume against any job description with AI.">
      <div className="row g-3 g-lg-4">
        <div className="col-12 col-lg-6">
          <div className="sr-card h-100 p-4">
            <h2 className="h6 mb-3">Resume file</h2>
            <div
              className={`sr-dropzone${dragging ? " dragging" : ""}`}
              onClick={() => inputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
            >
              <p className="mb-1 fw-medium">{file ? file.name : "Drag & drop your resume here"}</p>
              <p className="sr-muted mb-0" style={{ fontSize: ".88rem" }}>
                {file ? `${(file.size / 1024).toFixed(0)} KB · click to replace` : "or click to browse — PDF or DOCX only"}
              </p>
              <input
                ref={inputRef}
                type="file"
                accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                className="d-none"
                onChange={(e) => handleUpload(e.target.files?.[0])}
              />
            </div>
            {error ? <p className="text-danger mt-3 mb-0" style={{ fontSize: ".88rem" }}>{error}</p> : null}
            {uploadedResume && (
              <div className="mt-3 p-2 bg-light rounded text-success" style={{ fontSize: ".85rem" }}>
                ✓ Resume parsed & stored successfully ({uploadedResume.extractedSkills?.length || 0} skills detected)
              </div>
            )}
          </div>
        </div>

        <div className="col-12 col-lg-6">
          <div className="sr-card h-100 p-4 d-flex flex-column">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h2 className="h6 mb-0">Job description</h2>
              <button
                type="button"
                className="btn btn-sm btn-outline-primary"
                onClick={handleSuggestSkills}
                disabled={loadingSuggestions || !jobDescription.trim()}
                style={{ fontSize: ".8rem" }}
              >
                {loadingSuggestions ? "Suggesting…" : "✨ Suggest Skills"}
              </button>
            </div>
            <textarea
              className="form-control flex-grow-1"
              rows={7}
              placeholder="Paste the job description or required qualifications here…"
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
            />

            {suggestedSkills.length > 0 && (
              <div className="mt-3 p-2 border rounded bg-light">
                <span className="sr-muted d-block mb-1 fw-medium" style={{ fontSize: ".78rem" }}>
                  AI SUGGESTED SKILLS FOR THIS ROLE:
                </span>
                <div className="d-flex flex-wrap gap-1">
                  {suggestedSkills.map((s) => (
                    <span key={s} className="badge bg-primary text-light px-2 py-1" style={{ fontSize: ".78rem" }}>
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <button
              className="btn btn-primary mt-3 align-self-start px-4"
              onClick={handleAnalyze}
              disabled={analyzing || uploading}
            >
              {analyzing || uploading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" />
                  {uploading ? "Uploading file…" : "Running AI Analysis…"}
                </>
              ) : (
                "Analyze with AI"
              )}
            </button>
          </div>
        </div>

        {analyzing ? (
          <div className="col-12">
            <div className="sr-card p-5 text-center">
              <div className="spinner-border text-primary mb-3" role="status" />
              <p className="sr-muted mb-0">Running AI models to score your resume against the job description…</p>
            </div>
          </div>
        ) : null}

        {result ? (
          <div className="col-12">
            <div className="sr-card p-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h2 className="h6 mb-0">AI Match Results</h2>
                {modelSource && (
                  <span className="badge bg-secondary text-light px-2 py-1" style={{ fontSize: ".75rem" }}>
                    Engine: {modelSource === "python_ml_model" ? "Day 2 Python ML Model" : "Smart Heuristic Matcher"}
                  </span>
                )}
              </div>

              <div className="d-flex justify-content-between align-items-baseline mb-1">
                <span className="sr-muted" style={{ fontSize: ".9rem" }}>Overall match score</span>
                <span className="fw-bold fs-4">{Math.round(result.matchScore)}%</span>
              </div>
              <div className="progress mb-4" style={{ height: "10px" }} role="progressbar" aria-valuenow={result.matchScore} aria-valuemin={0} aria-valuemax={100}>
                <div
                  className={`progress-bar ${result.matchScore >= 70 ? 'bg-success' : result.matchScore >= 40 ? 'bg-warning' : 'bg-danger'}`}
                  style={{ width: `${Math.round(result.matchScore)}%` }}
                />
              </div>

              {result.feedback && (
                <div className="alert alert-info py-2 px-3 mb-4" style={{ fontSize: ".9rem" }}>
                  <strong>AI Feedback: </strong>{result.feedback}
                </div>
              )}

              <h3 className="h6 mb-2">Matched Skills</h3>
              <div className="mb-4 d-flex flex-wrap gap-2">
                {result.matchedSkills && result.matchedSkills.length > 0 ? (
                  result.matchedSkills.map((s) => (
                    <span key={s} className="sr-chip sr-chip-on">{s}</span>
                  ))
                ) : (
                  <span className="sr-muted" style={{ fontSize: ".85rem" }}>No direct keyword matches found.</span>
                )}
              </div>

              <h3 className="h6 mb-2">Missing Skills from Job Description</h3>
              <div className="d-flex flex-wrap gap-2">
                {result.missingSkills && result.missingSkills.length > 0 ? (
                  result.missingSkills.map((s) => (
                    <span key={s} className="sr-chip">{s}</span>
                  ))
                ) : (
                  <span className="text-success" style={{ fontSize: ".85rem" }}>No critical skills missing!</span>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </DashboardLayout>
  );
}
