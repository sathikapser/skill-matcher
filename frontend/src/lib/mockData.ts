export type UploadRecord = {
  id: string;
  fileName: string;
  uploadedAt: string;
  matchPercent: number;
};

export const MOCK_MATCH_SCORE = 78;

export const MOCK_SKILLS = [
  "React", "TypeScript", "Node.js", "Python", "SQL", "REST APIs",
  "Docker", "AWS", "Git", "Agile", "Data Analysis", "Communication",
];

export const MOCK_MISSING_SKILLS = ["Kubernetes", "GraphQL", "CI/CD"];

export const MOCK_UPLOADS: UploadRecord[] = [
  { id: "1", fileName: "alex_sharma_resume.pdf", uploadedAt: "2026-08-14", matchPercent: 78 },
  { id: "2", fileName: "frontend_role_v2.docx", uploadedAt: "2026-08-09", matchPercent: 64 },
  { id: "3", fileName: "resume_final.pdf", uploadedAt: "2026-07-28", matchPercent: 71 },
  { id: "4", fileName: "data_analyst_cv.pdf", uploadedAt: "2026-07-15", matchPercent: 52 },
];
