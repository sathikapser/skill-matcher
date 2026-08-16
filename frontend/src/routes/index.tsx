import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteNav, SiteFooter } from "@/components/SiteNav";
import { MatchRing } from "@/components/MatchRing";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SmartResume AI — AI Resume Skill Match Scoring" },
      { name: "description", content: "Upload your resume and get an AI-powered skill match score against any job description in seconds." },
      { property: "og:title", content: "SmartResume AI — AI Resume Skill Match Scoring" },
      { property: "og:description", content: "Upload your resume and get an AI-powered skill match score against any job description." },
    ],
  }),
  component: Landing,
});

const STEPS = [
  { n: "01", t: "Upload your resume", d: "Drop in a PDF or DOCX. We parse it instantly." },
  { n: "02", t: "Paste a job description", d: "Any role, any company, any format." },
  { n: "03", t: "Get your match score", d: "See matched skills, gaps and a 0–100 score." },
];

function Landing() {
  return (
    <>
      <SiteNav />

      <section className="container py-5 my-md-4">
        <div className="row align-items-center g-5">
          <div className="col-lg-6">
            <span className="sr-hero-eyebrow">Resume intelligence</span>
            <h1 className="display-5 mt-3 mb-3">
              Upload your resume, get an AI-powered skill match score.
            </h1>
            <p className="sr-muted fs-6 mb-4" style={{ maxWidth: "34rem" }}>
              SmartResume AI reads your resume, compares it against any job description,
              and shows exactly which skills land and which ones are missing.
            </p>
            <div className="d-flex flex-wrap gap-2">
              <Link to="/signup" className="btn btn-primary px-4">Get Started</Link>
              <Link to="/dashboard" className="btn btn-outline-secondary px-4">View demo dashboard</Link>
            </div>
            <p className="sr-muted mt-3 mb-0" style={{ fontSize: ".85rem" }}>
              No credit card required · PDF & DOCX supported
            </p>
          </div>

          <div className="col-lg-6">
            <div className="sr-card p-4 p-md-5 text-center">
              <MatchRing value={78} />
              <div className="mt-4 text-start">
                <div className="sr-muted mb-2" style={{ fontSize: ".8rem", letterSpacing: ".06em", textTransform: "uppercase" }}>
                  Matched skills
                </div>
                {["React", "TypeScript", "AWS", "SQL", "Docker"].map((s) => (
                  <span key={s} className="sr-chip sr-chip-on">{s}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container pb-5">
        <div className="row g-3">
          {STEPS.map((s) => (
            <div className="col-md-4" key={s.n}>
              <div className="sr-card h-100 p-4">
                <div className="sr-muted mb-2" style={{ fontSize: ".8rem", letterSpacing: ".1em" }}>{s.n}</div>
                <h2 className="h6 mb-2">{s.t}</h2>
                <p className="sr-muted mb-0" style={{ fontSize: ".92rem" }}>{s.d}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <SiteFooter />
    </>
  );
}
