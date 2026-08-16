import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { SiteNav } from "@/components/SiteNav";
import { apiSignup } from "@/lib/api";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Create your account — SmartResume AI" },
      { name: "description", content: "Sign up for SmartResume AI as a job seeker or recruiter and start matching resumes to jobs." },
      { property: "og:title", content: "Create your account — SmartResume AI" },
      { property: "og:description", content: "Sign up as a job seeker or recruiter and start matching resumes to jobs." },
    ],
  }),
  component: SignupPage,
});

function SignupPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "user" });

  const handleSignup = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!form.name || !form.email || !form.password) {
      setErrorMessage("Please fill out all fields.");
      return;
    }

    if (form.password.length < 6) {
      setErrorMessage("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      await apiSignup(form.name, form.email, form.password, form.role);
      navigate({ to: "/dashboard" });
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to create account.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SiteNav />
      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-12 col-md-7 col-lg-5">
            <div className="sr-card p-4 p-md-5">
              <h1 className="h4 mb-1">Create your account</h1>
              <p className="sr-muted mb-4" style={{ fontSize: ".92rem" }}>Start scoring resumes in under a minute.</p>

              {errorMessage && (
                <div className="alert alert-danger py-2 px-3 mb-3" style={{ fontSize: ".88rem" }}>
                  {errorMessage}
                </div>
              )}

              <form onSubmit={handleSignup} noValidate>
                <div className="mb-3">
                  <label className="form-label" htmlFor="name">Name</label>
                  <input
                    id="name"
                    className="form-control"
                    value={form.name}
                    required
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Alex Sharma"
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label" htmlFor="email">Email</label>
                  <input
                    id="email"
                    type="email"
                    className="form-control"
                    value={form.email}
                    required
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="you@company.com"
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label" htmlFor="password">Password</label>
                  <input
                    id="password"
                    type="password"
                    className="form-control"
                    value={form.password}
                    required
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="•••••••• (min 6 characters)"
                  />
                </div>
                <div className="mb-4">
                  <label className="form-label" htmlFor="role">Role</label>
                  <select
                    id="role"
                    className="form-select"
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                  >
                    <option value="user">Job Seeker</option>
                    <option value="recruiter">Recruiter</option>
                  </select>
                </div>
                <button className="btn btn-primary w-100" type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" />
                      Creating account…
                    </>
                  ) : (
                    "Create account"
                  )}
                </button>
              </form>

              <p className="sr-muted text-center mt-4 mb-0" style={{ fontSize: ".9rem" }}>
                Already have an account? <Link to="/login">Log in</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
