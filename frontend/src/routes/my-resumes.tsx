import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect, type FormEvent } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { UploadHistoryTable } from "./dashboard";
import {
  apiGetMyResumes,
  apiDeleteResume,
  apiClearHistory,
  apiUpdateResume,
  apiSearchResumes,
  Resume,
} from "@/lib/api";

export const Route = createFileRoute("/my-resumes")({
  head: () => ({
    meta: [
      { title: "My Resumes — SmartResume AI" },
      { name: "description", content: "Every resume you have uploaded to SmartResume AI, with dates and match scores." },
      { property: "og:title", content: "My Resumes — SmartResume AI" },
      { property: "og:description", content: "Every resume you uploaded, with dates and match scores." },
    ],
  }),
  component: MyResumesPage,
});

function MyResumesPage() {
  const navigate = useNavigate();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);

  const loadResumes = async () => {
    try {
      setLoading(true);
      const data = await apiGetMyResumes();
      setResumes(data);
    } catch (err: any) {
      setError(err.message || "Failed to load resumes.");
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
    loadResumes();
  }, [navigate]);

  const handleDeleteResume = async (resumeId: string) => {
    if (!confirm("Are you sure you want to delete this resume?")) return;
    try {
      await apiDeleteResume(resumeId);
      await loadResumes();
    } catch (err: any) {
      alert(err.message || "Failed to delete resume");
    }
  };

  const handleClearHistory = async () => {
    if (!confirm("Are you sure you want to delete ALL resumes from your account?")) return;
    try {
      await apiClearHistory();
      await loadResumes();
    } catch (err: any) {
      alert(err.message || "Failed to clear history");
    }
  };

  const handleSaveEdit = async (resumeId: string, updates: { fileName: string; extractedSkills: string[] }) => {
    try {
      await apiUpdateResume(resumeId, updates);
      await loadResumes();
    } catch (err: any) {
      alert(err.message || "Failed to update resume");
    }
  };

  const handleSearch = async (e: FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      return loadResumes();
    }
    try {
      setSearching(true);
      const results = await apiSearchResumes(searchQuery.trim());
      setResumes(results);
    } catch (err: any) {
      alert(err.message || "Failed to search resumes");
    } finally {
      setSearching(false);
    }
  };

  return (
    <DashboardLayout title="My Resumes" subtitle="All resumes you have uploaded and analysed so far.">
      <div className="sr-card p-4">
        {/* Search & Actions Bar */}
        <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-2">
          <form onSubmit={handleSearch} className="d-flex gap-2 flex-grow-1" style={{ maxWidth: 420 }}>
            <input
              type="text"
              className="form-control form-control-sm"
              placeholder="🔍 Search resumes by skill or keyword…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button type="submit" className="btn btn-sm btn-outline-primary" disabled={searching}>
              {searching ? "Searching…" : "Search"}
            </button>
            {searchQuery && (
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary"
                onClick={() => {
                  setSearchQuery("");
                  loadResumes();
                }}
              >
                Clear
              </button>
            )}
          </form>

          <div className="d-flex gap-2">
            {resumes.length > 0 && (
              <button
                type="button"
                className="btn btn-sm btn-outline-danger"
                onClick={handleClearHistory}
              >
                🗑️ Clear All
              </button>
            )}
            <Link to="/upload" className="btn btn-sm btn-primary">
              + Upload Resume
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-4">
            <div className="spinner-border text-primary mb-2" role="status" />
            <p className="sr-muted mb-0">Loading your resumes…</p>
          </div>
        ) : error ? (
          <div className="alert alert-danger mb-0">{error}</div>
        ) : (
          <UploadHistoryTable
            resumes={resumes}
            onDelete={handleDeleteResume}
            onEdit={handleSaveEdit}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
