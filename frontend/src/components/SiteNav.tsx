import { Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { apiLogout } from "@/lib/api";

export function SiteNav() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    setIsAuthenticated(!!token);
  }, []);

  return (
    <nav className="sr-nav sticky-top">
      <div className="container d-flex align-items-center justify-content-between py-3">
        <Link to="/" className="sr-brand fs-5">
          SmartResume <span className="sr-brand-dot">AI</span>
        </Link>
        <div className="d-flex align-items-center gap-2">
          {isAuthenticated ? (
            <>
              <Link to="/dashboard" className="btn btn-sm btn-outline-primary px-3">Dashboard</Link>
              <button
                type="button"
                onClick={() => {
                  apiLogout();
                  setIsAuthenticated(false);
                  window.location.href = "/login";
                }}
                className="btn btn-sm btn-outline-danger px-3"
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-sm btn-outline-secondary px-3">Log in</Link>
              <Link to="/signup" className="btn btn-sm btn-primary">Get Started</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

export function SiteFooter() {
  return (
    <footer className="sr-footer mt-5">
      <div className="container py-4 d-flex flex-wrap justify-content-between gap-2">
        <span>© 2026 SmartResume AI</span>
        <span>Built for job seekers and recruiters.</span>
      </div>
    </footer>
  );
}
