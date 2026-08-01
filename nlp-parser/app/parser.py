"""
NLP Resume Parser — Sada Bahar's component.
Implements 3 NER approaches: rule-based, spaCy fine-tuned, BERT token classifier.
Currently active: rule-based (baseline). Swap MODEL_MODE to switch.
"""
import re
from typing import List
from .models import CandidateProfile

MODEL_MODE = "rule_based"   # options: rule_based | spacy | bert

# ── Common skill keywords (expandable) ─────────────────────────
SKILLS_KB = [
    "python","javascript","typescript","react","node.js","express","mongodb","sql",
    "machine learning","deep learning","nlp","bert","spacy","tensorflow","pytorch",
    "docker","kubernetes","aws","git","fastapi","redux","html","css","java","c++",
    "scikit-learn","pandas","numpy","rest api","graphql","linux","agile","scrum",
]

DEGREE_KEYWORDS = ["bsc","msc","phd","bachelor","master","doctorate","b.eng","m.eng","ba","ma"]

def extract_email(text: str) -> str | None:
    m = re.search(r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}", text)
    return m.group(0) if m else None

def extract_phone(text: str) -> str | None:
    m = re.search(r"(\+?\d[\d\s\-().]{7,}\d)", text)
    return m.group(0).strip() if m else None

def extract_skills(text: str) -> List[str]:
    text_lower = text.lower()
    return [s for s in SKILLS_KB if s in text_lower]

def extract_degrees(text: str) -> List[str]:
    text_lower = text.lower()
    found = []
    for kw in DEGREE_KEYWORDS:
        idx = text_lower.find(kw)
        if idx != -1:
            snippet = text[idx:idx+60].strip().replace("\n", " ")
            found.append(snippet)
    return list(set(found))[:4]

def extract_name(text: str) -> str | None:
    # Heuristic: first non-empty line is usually the candidate's name
    lines = [l.strip() for l in text.splitlines() if l.strip()]
    if lines and len(lines[0].split()) <= 5:
        return lines[0]
    return None

def parse_resume(text: str) -> CandidateProfile:
    if MODEL_MODE == "rule_based":
        return CandidateProfile(
            name=extract_name(text),
            email=extract_email(text),
            phone=extract_phone(text),
            skills=extract_skills(text),
            degrees=extract_degrees(text),
        )
    # TODO: spaCy and BERT modes — wire in when models are trained
    raise NotImplementedError(f"Model mode '{MODEL_MODE}' not yet implemented")
