"""
SmartResume AI - Python Model Microservice Bridge (FastAPI + Trained spaCy NER Model)
Run with: .\.venv\Scripts\python.exe python_model_service.py
"""

import os
from typing import List, Optional, Dict
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import uvicorn
import spacy

app = FastAPI(title="SmartResume AI NER Model Service", version="1.0.0")

# ---------------------------------------------------------
# Load Trained spaCy Resume NER Model from ml_model/
# ---------------------------------------------------------
MODEL_DIR = os.path.join(os.path.dirname(__file__), "ml_model")
nlp = None

if os.path.exists(MODEL_DIR):
    try:
        nlp = spacy.load(MODEL_DIR)
        print(f"[OK] Successfully loaded trained Resume NER model from: {MODEL_DIR}")
        print(f"[INFO] Available Entity Labels: {nlp.pipe_labels.get('ner', [])}")
    except Exception as e:
        print(f"[WARN] Error loading spaCy model from {MODEL_DIR}: {e}")
else:
    print(f"[WARN] Model directory {MODEL_DIR} not found. Running with fallback engine.")

class AnalyzeRequest(BaseModel):
    resumeText: str
    jobDescription: str
    extractedSkills: Optional[List[str]] = []

class AnalyzeResponse(BaseModel):
    matchScore: float
    matchedSkills: List[str]
    missingSkills: List[str]
    entities: Optional[Dict[str, List[str]]] = {}
    feedback: str

class SuggestSkillsRequest(BaseModel):
    job_description: Optional[str] = ""
    jobDescription: Optional[str] = ""

class SuggestSkillsResponse(BaseModel):
    suggested_skills: List[str]
    extracted_from_ner: List[str]
    message: str

# Skill Knowledge Graph / Taxonomy for Smart Suggestion
SKILL_TAXONOMY = {
    "react": ["React", "JavaScript", "HTML5", "CSS3", "TypeScript", "Redux", "Next.js"],
    "node.js": ["Node.js", "Express", "MongoDB", "REST API", "JavaScript", "PostgreSQL"],
    "nodejs": ["Node.js", "Express", "MongoDB", "REST API", "JavaScript"],
    "python": ["Python", "Django", "FastAPI", "SQL", "Git", "REST APIs"],
    "java": ["Java", "Spring Boot", "Hibernate", "MySQL", "Microservices", "Maven"],
    "machine learning": ["Machine Learning", "Python", "Scikit-Learn", "TensorFlow", "PyTorch", "Pandas", "NumPy"],
    "deep learning": ["Deep Learning", "PyTorch", "TensorFlow", "Computer Vision", "NLP", "Neural Networks"],
    "nlp": ["NLP", "Natural Language Processing", "spaCy", "Transformers", "BERT", "NLTK"],
    "aws": ["AWS", "Docker", "CI/CD", "Linux", "Terraform", "Kubernetes"],
    "cloud": ["Cloud Computing", "AWS", "Azure", "GCP", "Docker", "Kubernetes"],
    "docker": ["Docker", "Kubernetes", "Linux", "CI/CD", "Git"],
    "full stack": ["React", "Node.js", "TypeScript", "MongoDB", "SQL", "HTML5", "CSS3", "Git"],
    "frontend": ["HTML5", "CSS3", "JavaScript", "TypeScript", "React", "Tailwind CSS"],
    "backend": ["Node.js", "Python", "REST API", "MongoDB", "PostgreSQL", "System Design"],
    "data science": ["Python", "Pandas", "NumPy", "SQL", "Tableau", "Data Analysis", "Statistics"]
}

@app.get("/")
def home():
    return {
        "status": "online",
        "service": "SmartResume AI spaCy NER Model Service",
        "modelLoaded": nlp is not None,
        "labels": nlp.pipe_labels.get("ner", []) if nlp else []
    }

@app.post("/suggest_skills", response_model=SuggestSkillsResponse)
def suggest_skills(req: SuggestSkillsRequest):
    """
    Extracts & suggests required skills for a given job description using your trained NER model.
    """
    jd_text = req.job_description or req.jobDescription or ""
    if not jd_text.strip():
        return SuggestSkillsResponse(
            suggested_skills=["React", "Node.js", "JavaScript", "HTML", "CSS", "Python", "SQL"],
            extracted_from_ner=[],
            message="No job description text provided. Showing popular default tech skills."
        )

    ner_skills = []
    if nlp is not None:
        try:
            doc = nlp(jd_text)
            for ent in doc.ents:
                if ent.label_ == "Skills":
                    s_clean = ent.text.strip()
                    if s_clean and s_clean not in ner_skills:
                        ner_skills.append(s_clean)
        except Exception as e:
            print(f"Error extracting NER skills from JD: {e}")

    # Taxonomy expansion
    suggested = set(ner_skills)
    lower_jd = jd_text.lower()

    for key, related_list in SKILL_TAXONOMY.items():
        if key in lower_jd:
            for item in related_list:
                suggested.add(item)

    # General tech keyword matching fallback
    common_keywords = [
        "React", "Node.js", "JavaScript", "TypeScript", "Python", "Java", "C++", "C#",
        "HTML5", "CSS3", "Tailwind CSS", "Bootstrap", "MongoDB", "PostgreSQL", "MySQL",
        "Docker", "Kubernetes", "AWS", "Azure", "Git", "REST API", "GraphQL", "Agile"
    ]
    for ck in common_keywords:
        if ck.lower() in lower_jd:
            suggested.add(ck)

    final_skills = list(suggested)
    if not final_skills:
        final_skills = ["Communication", "Problem Solving", "Teamwork", "Git"]

    return SuggestSkillsResponse(
        suggested_skills=final_skills[:12],
        extracted_from_ner=ner_skills,
        message=f"Suggested {len(final_skills[:12])} relevant skills based on job description."
    )

@app.post("/analyze", response_model=AnalyzeResponse)
def analyze(req: AnalyzeRequest):
    """
    Analyzes resume text against job description using your trained spaCy model.
    """
    resume_text = req.resumeText or ""
    job_desc = req.jobDescription or ""

    if not resume_text:
        raise HTTPException(status_code=400, detail="Resume text is required")

    entities: Dict[str, List[str]] = {}
    resume_skills: List[str] = list(req.extractedSkills or [])

    # 1. Run NER Model on Resume Text if available
    if nlp is not None:
        try:
            doc = nlp(resume_text)
            for ent in doc.ents:
                label = ent.label_
                text_val = ent.text.strip()
                if label not in entities:
                    entities[label] = []
                if text_val not in entities[label]:
                    entities[label].append(text_val)

            # Collect skills identified by NER
            if "Skills" in entities:
                for s in entities["Skills"]:
                    if s not in resume_skills:
                        resume_skills.append(s)
        except Exception as ner_err:
            print(f"NER extraction error: {ner_err}")

    # 2. Extract keywords from Job Description
    job_doc_skills = []
    if nlp is not None:
        try:
            job_doc = nlp(job_desc)
            for ent in job_doc.ents:
                if ent.label_ == "Skills" and ent.text.strip() not in job_doc_skills:
                    job_doc_skills.append(ent.text.strip())
        except Exception:
            pass

    # Common tech words fallback for matching
    common_skills = [
        "python", "javascript", "typescript", "react", "node.js", "express",
        "mongodb", "sql", "postgresql", "docker", "kubernetes", "aws", "git",
        "fastapi", "django", "machine learning", "nlp", "data analysis", "rest api"
    ]

    lower_resume = resume_text.lower()
    lower_job = job_desc.lower()

    # Find job requirements
    required_skills = set(job_doc_skills)
    for skill in common_skills:
        if skill in lower_job:
            required_skills.add(skill.capitalize())

    matched = []
    missing = []

    for skill in required_skills:
        if skill.lower() in lower_resume or any(skill.lower() == s.lower() for s in resume_skills):
            matched.append(skill)
        else:
            missing.append(skill)

    # If no specific required skills found, match general resume skills
    if not required_skills:
        matched = resume_skills[:6]
        missing = []
        score = 75.0
    else:
        score = round((len(matched) / len(required_skills)) * 100, 1)

    score = max(15.0, min(98.0, score))

    feedback_msg = (
        f"NER Model identified {len(resume_skills)} skills in resume. "
        f"Matched {len(matched)} of {len(required_skills)} target job requirements."
        if required_skills
        else f"Extracted {len(resume_skills)} skills with your custom NER model."
    )

    return AnalyzeResponse(
        matchScore=score,
        matchedSkills=matched,
        missingSkills=missing,
        entities=entities,
        feedback=feedback_msg
    )

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)
