"""
Job Matcher — Faisal Arbab's component.
v3: Adaptive dual-scoring.
  - PRIMARY:   Skill coverage  = candidate_skills ∩ job_required / job_required
  - SECONDARY: Text similarity = TF-IDF cosine (holistic — uses full CV rawText)
  - BLEND:     Weighted by job description richness.
    Sparse job (few words / few skills) → skill coverage dominates (85%).
    Rich job description → 50/50 blend.
This ensures: if a job only requires "Python" and you have Python → ~85%+ match.
"""
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from typing import List, Tuple, Optional
import re

MODEL_MODE = "tfidf"

SKILLS_KB = [
    "python", "javascript", "typescript", "java", "c++", "c#", "php", "ruby",
    "go", "rust", "swift", "kotlin", "dart", "bash",
    "react", "angular", "vue", "html", "css", "redux", "next.js",
    "node.js", "express", "django", "flask", "fastapi", "spring", "rest api", "graphql",
    "machine learning", "deep learning", "nlp", "bert", "spacy",
    "tensorflow", "pytorch", "scikit-learn", "pandas", "numpy",
    "mongodb", "sql", "postgresql", "mysql", "firebase", "oracle db", "redis",
    "docker", "kubernetes", "aws", "gcp", "azure", "git", "linux", "ci/cd",
    "cybersecurity", "networking", "agile", "scrum",
]


def _profile_to_text(profile: dict) -> str:
    """Full CV text + repeated skills for TF-IDF weight."""
    parts = []
    raw = profile.get("rawText") or profile.get("raw_text") or ""
    if raw.strip():
        parts.append(raw.strip())
    skills = profile.get("skills", [])
    if isinstance(skills, list) and skills:
        skill_text = " ".join(skills)
        parts.append(skill_text)
        parts.append(skill_text)  # weight boost
    for key in ("degrees", "jobTitles", "job_titles", "companies", "institutions"):
        vals = profile.get(key, [])
        if isinstance(vals, list) and vals:
            parts.append(" ".join(v for v in vals if v))
    return " ".join(filter(None, parts))


def tfidf_match(candidate_text: str, job_text: str) -> float:
    corpus = [candidate_text, job_text]
    vec = TfidfVectorizer(ngram_range=(1, 2), stop_words="english")
    tfidf = vec.fit_transform(corpus)
    return float(cosine_similarity(tfidf[0:1], tfidf[1:2])[0][0])


def get_skill_overlap(profile: dict, job_text: str) -> Tuple[List[str], List[str], List[str]]:
    """
    Returns (matched, missing, job_required).
    matched      = candidate skills that appear in the job description
    missing      = skills job requires that candidate does NOT have
    job_required = all skills extracted from job description
    """
    candidate_skills = set(s.lower() for s in profile.get("skills", []))
    job_lower = job_text.lower()

    job_required = [
        s for s in SKILLS_KB
        if re.search(r'\b' + re.escape(s) + r'\b', job_lower)
    ]
    matched = [s for s in job_required if s.lower() in candidate_skills]
    missing = [s for s in job_required if s.lower() not in candidate_skills]

    return matched, missing, job_required


def adaptive_score(skill_coverage: Optional[float], text_sim: Optional[float],
                   job_word_count: int) -> float:
    """
    Blend skill coverage and text similarity based on how rich the job description is.
    Sparse jobs (< 20 words / few skills) → skill coverage almost entirely.
    Rich jobs (80+ words) → 50/50 blend.
    """
    if skill_coverage is None and text_sim is None:
        return 0.0
    if skill_coverage is None:
        return min(1.0, text_sim)
    if text_sim is None:
        return min(1.0, skill_coverage)

    if job_word_count < 20:
        w_skill, w_text = 0.85, 0.15
    elif job_word_count < 80:
        w_skill, w_text = 0.65, 0.35
    else:
        w_skill, w_text = 0.50, 0.50

    return min(1.0, w_skill * skill_coverage + w_text * text_sim)


def match(profile: dict, job_description: str):
    candidate_text = _profile_to_text(profile)
    matched, missing, job_required = get_skill_overlap(profile, job_description)

    # Skill coverage: what % of job requirements does the candidate meet?
    if job_required:
        skill_coverage = len(matched) / len(job_required)
    else:
        skill_coverage = None  # no skills listed — can't assess coverage

    # Text similarity (holistic)
    job_word_count = len(job_description.split())
    if candidate_text.strip() and job_word_count >= 5:
        text_sim = tfidf_match(candidate_text, job_description)
    else:
        text_sim = None

    score = adaptive_score(skill_coverage, text_sim, job_word_count)

    pct = int(score * 100)
    strength = f"Strong alignment on: {', '.join(matched[:3])}." if matched else "General profile alignment detected."
    gap     = f"Consider upskilling in: {', '.join(missing[:3])}." if missing else "No significant skill gaps identified."

    explanation = f"Candidate matches {pct}% of the job requirements. {strength} {gap}"
    return score, matched, missing, explanation
