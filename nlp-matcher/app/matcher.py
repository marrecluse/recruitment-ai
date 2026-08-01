"""
Job Matcher — Faisal Arbab's component.
MODEL_MODE controls which algorithm runs:
  tfidf   → TF-IDF cosine similarity baseline (start here per supervisor)
  sbert   → Sentence-BERT semantic embeddings
  bert_clf→ BERT binary classifier (to be fine-tuned)
"""
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from typing import List
import numpy as np

MODEL_MODE = "tfidf"   # switch to "sbert" once sentence-transformers is ready


def _profile_to_text(profile: dict) -> str:
    parts = []
    for key in ("skills","degrees","job_titles","companies"):
        vals = profile.get(key, [])
        if isinstance(vals, list):
            parts.extend(vals)
    return " ".join(parts)


def tfidf_match(candidate_text: str, job_text: str) -> float:
    corpus = [candidate_text, job_text]
    vec = TfidfVectorizer(ngram_range=(1, 2), stop_words="english")
    tfidf = vec.fit_transform(corpus)
    return float(cosine_similarity(tfidf[0:1], tfidf[1:2])[0][0])


def get_skill_overlap(profile: dict, job_text: str):
    skills = profile.get("skills", [])
    job_lower = job_text.lower()
    matched  = [s for s in skills if s.lower() in job_lower]
    missing  = [s for s in skills if s.lower() not in job_lower]
    return matched, missing


def match(profile: dict, job_description: str):
    candidate_text = _profile_to_text(profile)

    if MODEL_MODE == "tfidf":
        score = tfidf_match(candidate_text, job_description)
    elif MODEL_MODE == "sbert":
        from sentence_transformers import SentenceTransformer, util
        model = SentenceTransformer("all-MiniLM-L6-v2")
        emb_c = model.encode(candidate_text, convert_to_tensor=True)
        emb_j = model.encode(job_description,  convert_to_tensor=True)
        score = float(util.cos_sim(emb_c, emb_j)[0][0])
    else:
        raise NotImplementedError(f"Model mode '{MODEL_MODE}' not implemented")

    matched, missing = get_skill_overlap(profile, job_description)
    pct = int(score * 100)
    explanation = (
        f"Candidate matches {pct}% of the job requirements. "
        f"Strong alignment on: {', '.join(matched[:3]) or 'general profile'}. "
        f"Skill gaps: {', '.join(missing[:3]) or 'none identified'}."
    )
    return score, matched, missing, explanation
