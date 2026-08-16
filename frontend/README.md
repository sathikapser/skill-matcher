# Skill Matcher

## Phase 1 — Day 1: Frontend (Lovable)




### 1.1 What to build today

- Landing page

- Signup / Login pages

- Resume upload page (drag-and-drop)

- Dashboard page with: skill-match % chart, list of extracted skills, upload history

- Loading states + responsive layout




### 1.2 Prompt to paste into Lovable

```

Build a web app called "SmartResume AI" — a resume analysis SaaS tool.




Pages needed:

1. Landing page — hero section explaining "Upload your resume, get an AI-powered

   skill match score against any job description." Include a CTA button "Get Started".




2. Signup page — fields: Name, Email, Password, Role (dropdown: Job Seeker / Recruiter).

3. Login page — Email, Password, "Forgot password" link (UI only, no logic needed yet).




4. Dashboard page (after login):

   - Left sidebar navigation: Dashboard, Upload Resume, My Resumes, Logout.

   - Top card showing "Match Score" as a circular progress chart (0-100%).

   - Below it, a tag-cloud / chip list of "Extracted Skills".

   - A table showing upload history: File name, Upload date, Match %.




5. Upload Resume page:

   - Drag-and-drop file upload box (accept PDF/DOCX only).

   - Textarea for pasting a "Job Description" to match against.

   - "Analyze" button.

   - Loading spinner state while "analyzing" (simulate with placeholder state for now).

   - Results section below showing extracted skills as chips and a match % bar.




Design requirements:

- Clean, modern SaaS look. Use a blue/indigo primary color, white background, soft shadows,

  rounded cards.

- Fully responsive (mobile + desktop).

- Use placeholder/mock data for now — I will connect a real backend API later.

- Add clear component structure so I can later wire up API calls

  (e.g., name buttons/forms clearly: handleSignup, handleLogin, handleUpload, handleAnalyze).

- Include a config file or clearly marked section where I can later paste in a backend API base URL.

```




### 1.3 End of Day 1 checklist

- [ ] All 5 pages exist and navigate correctly

- [ ] Upload UI accepts PDF/DOCX (even if not yet functional)

- [ ] Dashboard renders with mock/dummy data

- [ ] Mobile view doesn't break




---create it with an minimalism and professional style ui important point is dont use tailwind for css you can use bootstrap instead

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/e07691ed-d9d5-49b0-bde0-fdae104b4323).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
