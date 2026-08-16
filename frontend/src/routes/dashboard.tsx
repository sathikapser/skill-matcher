import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { MatchRing } from "@/components/MatchRing";
import {
  apiGetDashboard,
  apiDeleteResume,
  apiClearHistory,
  apiUpdateResume,
  DashboardResponse,
  Resume,
} from "@/lib/api";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — SmartResume AI" },
      { name: "description", content: "Your latest resume match score, extracted skills and full upload history in one view." },
      { property: "og:title", content: "Dashboard — SmartResume AI" },
      { property: "og:description", content: "Latest match score, extracted skills and upload history." },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const dashboardData = await apiGetDashboard();
      setData(dashboardData);
    } catch (err: any) {
      setError(err.message || "Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate({ to: "/login" });
      return;
    }
    loadDashboard();
  }, [navigate]);

  const handleDeleteResume = async (resumeId: string) => {
    if (!confirm("Are you sure you want to delete this resume?")) return;
    try {
      await apiDeleteResume(resumeId);
      await loadDashboard();
    } catch (err: any) {
      alert(err.message || "Failed to delete resume");
    }
  };

  const handleClearAllHistory = async () => {
    if (!confirm("Are you sure you want to clear your entire upload history? This cannot be undone.")) return;
    try {
      await apiClearHistory();
      await loadDashboard();
    } catch (err: any) {
      alert(err.message || "Failed to clear history");
    }
  };

  const handleSaveResumeEdit = async (resumeId: string, updates: { fileName: string; extractedSkills: string[] }) => {
    try {
      await apiUpdateResume(resumeId, updates);
      await loadDashboard();
    } catch (err: any) {
      alert(err.message || "Failed to update resume");
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Dashboard" subtitle="Loading your resume analysis…">
        <div className="text-center py-5">
          <div className="spinner-border text-primary mb-3" role="status" />
          <p className="sr-muted">Fetching your resumes and analysis history…</p>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !data) {
    return (
      <DashboardLayout title="Dashboard" subtitle="Overview of your resume analysis.">
        <div className="alert alert-warning p-4">
          <h5 className="alert-heading">Dashboard Notice</h5>
          <p className="mb-3">{error || "Could not retrieve dashboard data."}</p>
          <Link to="/upload" className="btn btn-primary">
            Upload your first resume
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const latestResume = data.resumes && data.resumes.length > 0 ? data.resumes[0] : null;
  const latestAnalysis = latestResume?.latestAnalysis;
  const latestScore = latestAnalysis ? Math.round(latestAnalysis.matchScore) : data.metrics.averageMatchScore || 0;
  const extractedSkills = latestResume?.extractedSkills || data.skillsSummary || [];
  const missingSkills = latestAnalysis?.missingSkills || [];

  return (
    <DashboardLayout
      title={`Welcome back, ${data.user?.name || "User"}!`}
      subtitle="Overview of your most recent resume analysis and metrics."
    >
      <div className="row g-3 g-lg-4">
        {/* Metric Cards Row */}
        <div className="col-12 col-md-4">
          <div className="sr-card p-3 text-center">
            <span className="sr-muted d-block mb-1" style={{ fontSize: ".85rem" }}>Total Resumes</span>
            <span className="h4 fw-bold mb-0">{data.metrics.totalResumes}</span>
          </div>
        </div>
        <div className="col-12 col-md-4">
          <div className="sr-card p-3 text-center">
            <span className="sr-muted d-block mb-1" style={{ fontSize: ".85rem" }}>Analyzed Matches</span>
            <span className="h4 fw-bold mb-0">{data.metrics.analyzedResumesCount}</span>
          </div>
        </div>
        <div className="col-12 col-md-4">
          <div className="sr-card p-3 text-center">
            <span className="sr-muted d-block mb-1" style={{ fontSize: ".85rem" }}>Unique Skills Found</span>
            <span className="h4 fw-bold mb-0">{data.metrics.uniqueSkillsCount}</span>
          </div>
        </div>

        {/* Match Ring Card */}
        <div className="col-12 col-xl-4">
          <div className="sr-card h-100 p-4 text-center d-flex flex-column justify-content-center">
            <MatchRing value={latestScore} />
            <p className="sr-muted mt-3 mb-0" style={{ fontSize: ".9rem" }}>
              {latestResume
                ? `Score for "${latestResume.fileName}"`
                : "Upload a resume to see your match score"}
            </p>
          </div>
        </div>

        {/* Skills Card */}
        <div className="col-12 col-xl-8">
          <div className="sr-card h-100 p-4">
            <h2 className="h6 mb-3">Extracted Skills ({extractedSkills.length})</h2>
            <div className="mb-4 d-flex flex-wrap gap-2">
              {extractedSkills.length > 0 ? (
                extractedSkills.map((s) => (
                  <span key={s} className="sr-chip sr-chip-on">{s}</span>
                ))
              ) : (
                <p className="sr-muted mb-0" style={{ fontSize: ".88rem" }}>
                  No skills extracted yet. Upload a resume to automatically detect tech skills.
                </p>
              )}
            </div>

            <h3 className="h6 mb-3">Missing Skills from Latest Target Job</h3>
            <div className="d-flex flex-wrap gap-2">
              {missingSkills.length > 0 ? (
                missingSkills.map((s) => (
                  <span key={s} className="sr-chip">{s}</span>
                ))
              ) : (
                <p className="sr-muted mb-0" style={{ fontSize: ".88rem" }}>
                  {latestAnalysis
                    ? "✓ No key skills missing for this job description!"
                    : "Match against a job description in the Upload page to view skill gaps."}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Upload History Table */}
        <div className="col-12">
          <div className="sr-card p-4">
            <div className="d-flex flex-wrap justify-content-between align-items-center mb-3 gap-2">
              <h2 className="h6 mb-0">Upload History</h2>
              <div className="d-flex gap-2">
                {data.resumes && data.resumes.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearAllHistory}
                    className="btn btn-sm btn-outline-danger"
                  >
                    🗑️ Clear All History
                  </button>
                )}
                <Link to="/upload" className="btn btn-sm btn-primary">
                  + Upload resume
                </Link>
              </div>
            </div>
            <UploadHistoryTable
              resumes={data.resumes}
              onDelete={handleDeleteResume}
              onEdit={handleSaveResumeEdit}
            />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export function UploadHistoryTable({
  resumes,
  onDelete,
  onEdit,
}: {
  resumes?: Resume[];
  onDelete?: (id: string) => void;
  onEdit?: (id: string, updates: { fileName: string; extractedSkills: string[] }) => void;
}) {
  const [editingResume, setEditingResume] = useState<Resume | null>(null);
  const [editName, setEditName] = useState("");
  const [editSkills, setEditSkills] = useState("");

  const startEdit = (resume: Resume) => {
    setEditingResume(resume);
    setEditName(resume.fileName);
    setEditSkills((resume.extractedSkills || []).join(", "));
  };

  const saveEdit = () => {
    if (!editingResume || !onEdit) return;
    const skillsArray = editSkills
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    onEdit(editingResume._id, { fileName: editName, extractedSkills: skillsArray });
    setEditingResume(null);
  };

  if (!resumes || resumes.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="sr-muted mb-3">No resumes uploaded yet.</p>
        <Link to="/upload" className="btn btn-outline-primary btn-sm">
          Upload your first resume
        </Link>
      </div>
    );
  }

  return (
    <>
      {/* Inline Edit Modal */}
      {editingResume && (
        <div
          className="modal show d-block"
          tabIndex={-1}
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title fs-6">Edit / Alter Resume</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setEditingResume(null)}
                />
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Resume Name</label>
                  <input
                    type="text"
                    className="form-control"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Skills (comma-separated)</label>
                  <textarea
                    rows={3}
                    className="form-control"
                    value={editSkills}
                    onChange={(e) => setEditSkills(e.target.value)}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-sm btn-secondary"
                  onClick={() => setEditingResume(null)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-primary"
                  onClick={saveEdit}
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="table-responsive">
        <table className="table align-middle mb-0">
          <thead>
            <tr>
              <th>File Name</th>
              <th>Uploaded Date</th>
              <th>Skills Detected</th>
              <th style={{ minWidth: 160 }}>Match %</th>
              <th className="text-end">Actions</th>
            </tr>
          </thead>
          <tbody>
            {resumes.map((u) => {
              const score = u.latestAnalysis ? Math.round(u.latestAnalysis.matchScore) : 0;
              const dateStr = u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "Recent";
              return (
                <tr key={u._id}>
                  <td className="fw-medium">
                    <a
                      href={u.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-decoration-none"
                    >
                      📄 {u.fileName}
                    </a>
                  </td>
                  <td className="sr-muted">{dateStr}</td>
                  <td>
                    <span className="badge bg-light text-dark border">
                      {u.extractedSkills?.length || 0} skills
                    </span>
                  </td>
                  <td>
                    <div className="d-flex align-items-center gap-2">
                      <div
                        className="progress flex-grow-1"
                        role="progressbar"
                        aria-valuenow={score}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        style={{ height: "8px" }}
                      >
                        <div
                          className={`progress-bar ${
                            score >= 70 ? "bg-success" : score >= 40 ? "bg-warning" : "bg-secondary"
                          }`}
                          style={{ width: `${score}%` }}
                        />
                      </div>
                      <span style={{ fontSize: ".85rem", minWidth: 36 }}>
                        {score > 0 ? `${score}%` : "—"}
                      </span>
                    </div>
                  </td>
                  <td className="text-end">
                    <div className="btn-group btn-group-sm">
                      <button
                        type="button"
                        onClick={() => startEdit(u)}
                        className="btn btn-outline-secondary btn-sm"
                        title="Edit Resume"
                      >
                        ✏️
                      </button>
                      {onDelete && (
                        <button
                          type="button"
                          onClick={() => onDelete(u._id)}
                          className="btn btn-outline-danger btn-sm"
                          title="Delete Resume"
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
