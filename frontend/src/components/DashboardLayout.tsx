import { Link, useNavigate } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { apiLogout } from "@/lib/api";

export function DashboardLayout({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  const navigate = useNavigate();

  const handleLogout = () => {
    apiLogout();
    navigate({ to: "/login" });
  };

  return (
    <div className="container-fluid p-0">
      <div className="row g-0 min-vh-100">
        <aside className="col-12 col-lg-2 sr-sidebar p-3">
          <Link to="/" className="sr-brand fs-6 d-block mb-4 px-2">
            SmartResume <span className="sr-brand-dot">AI</span>
          </Link>
          <nav className="d-flex flex-lg-column flex-row flex-wrap gap-1">
            <Link
              to="/dashboard"
              className="sr-sidelink"
              activeProps={{ className: "sr-sidelink active" }}
            >
              Dashboard
            </Link>
            <Link
              to="/upload"
              className="sr-sidelink"
              activeProps={{ className: "sr-sidelink active" }}
            >
              Upload Resume
            </Link>
            <Link
              to="/my-resumes"
              className="sr-sidelink"
              activeProps={{ className: "sr-sidelink active" }}
            >
              My Resumes
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="sr-sidelink border-0 bg-transparent text-start text-danger mt-lg-auto"
            >
              Logout
            </button>
          </nav>
        </aside>

        <main className="col-12 col-lg-10 sr-soft p-3 p-md-4 p-lg-5">
          <header className="mb-4">
            <h1 className="h3 mb-1">{title}</h1>
            {subtitle ? <p className="sr-muted mb-0">{subtitle}</p> : null}
          </header>
          {children}
        </main>
      </div>
    </div>
  );
}
