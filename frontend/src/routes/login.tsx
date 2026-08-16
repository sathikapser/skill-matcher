import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { SiteNav } from "@/components/SiteNav";
import { apiLogin } from "@/lib/api";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Log in — SmartResume AI" },
      { name: "description", content: "Log in to SmartResume AI to view your resume match scores, extracted skills and upload history." },
      { property: "og:title", content: "Log in — SmartResume AI" },
      { property: "og:description", content: "Access your resume match scores, extracted skills and upload history." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [form, setForm] = useState({ email: "", password: "" });

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!form.email || !form.password) {
      setErrorMessage("Please enter both email and password.");
      return;
    }

    setLoading(true);
    try {
      await apiLogin(form.email, form.password);
      navigate({ to: "/dashboard" });
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to log in. Please check your credentials.");
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
              <h1 className="h4 mb-1">Welcome back</h1>
              <p className="sr-muted mb-4" style={{ fontSize: ".92rem" }}>Log in to your SmartResume AI account.</p>

              {errorMessage && (
                <div className="alert alert-danger py-2 px-3 mb-3" style={{ fontSize: ".88rem" }}>
                  {errorMessage}
                </div>
              )}

              <form onSubmit={handleLogin} noValidate>
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
                <div className="mb-2">
                  <label className="form-label" htmlFor="password">Password</label>
                  <input
                    id="password"
                    type="password"
                    className="form-control"
                    value={form.password}
                    required
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="••••••••"
                  />
                </div>
                <div className="d-flex justify-content-end mb-4">
                  <a href="#" style={{ fontSize: ".86rem" }}>Forgot password?</a>
                </div>
                <button className="btn btn-primary w-100" type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" />
                      Logging in…
                    </>
                  ) : (
                    "Log in"
                  )}
                </button>
              </form>

              <p className="sr-muted text-center mt-4 mb-0" style={{ fontSize: ".9rem" }}>
                New here? <Link to="/signup">Create an account</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
