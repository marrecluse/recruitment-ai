"""
NLP Resume Parser — Sada Bahar's component.
Implements 3 NER approaches: rule-based, spaCy fine-tuned, BERT token classifier.
Currently active: rule-based (baseline). Swap MODEL_MODE to switch.
"""
import re
from typing import List
from .models import CandidateProfile

MODEL_MODE = "rule_based"   # options: rule_based | spacy | bert

# ── Skill aliases: map abbreviations/variants → canonical form ──
# Applied as word-boundary regex replacements BEFORE skill extraction.
# IMPORTANT: only alias a skill if it should become a *different* canonical term.
# Never alias a skill to a different skill that also exists in SKILLS_KB independently
# (e.g. do NOT alias 'mysql' → 'sql' — they are separate skills).
SKILL_ALIASES = {
    r'\bjs\b':              'javascript',
    r'\bts\b':              'typescript',
    r'\bpy\b':              'python',
    r'\bpython[23]\b':      'python',       # python2, python3 → python
    r'\bml\b':              'machine learning',
    r'\bai\b':              'machine learning',
    r'\bk8s\b':             'kubernetes',
    r'\bkube\b':            'kubernetes',
    r'\bnode\.?js\b':       'node.js',
    r'\breact\.?js\b':      'react',
    r'\bvue\.?js\b':        'vue',
    r'\bpostgres\b':        'postgresql',
    r'\bpostgresql\b':      'postgresql',
    # NOTE: 'mysql' is intentionally NOT aliased — it lives in SKILLS_KB directly.
    # Previously 'mysql' was aliased to 'sql' which caused mysql to never be extracted.
    r'\bmariadb\b':         'mysql',        # MariaDB is MySQL-compatible → mysql
    r'\bnosql\b':           'mongodb',
    r'\brest\b':            'rest api',
    r'\brestful\b':         'rest api',
    r'\btf\b':              'tensorflow',
    r'\bsklearn\b':         'scikit-learn',
    r'\bsc-?learn\b':       'scikit-learn',
    r'\bnlp\b':             'nlp',
    r'\bci/?cd\b':          'ci/cd',
    r'\bdevops\b':          'ci/cd',
    r'\bshell\b':           'bash',
    r'\bsh\b':              'bash',
    r'\bphp\b':             'php',
    r'\bgcp\b':             'gcp',
    r'\bazure\b':           'azure',
    r'\bdartsdk\b':         'dart',
    r'\bsecurity\b':        'cybersecurity',
    r'\bcybersec\b':        'cybersecurity',
    r'\binfosec\b':         'cybersecurity',
    r'\bnetwork(?:ing)?\b': 'networking',
    r'\bfirebase\b':        'firebase',
    r'\boracle\b':          'oracle db',
    r'\bdhcp\b':            'networking',
    r'\bdns\b':             'networking',
    r'\bssh\b':             'linux',
    r'\btcp/?ip\b':         'networking',
}

# ── Canonical skill list (SKILLS_KB) ───────────────────────────
SKILLS_KB = [
    # Languages
    "python", "javascript", "typescript", "java", "c++", "c#", "php", "ruby",
    "go", "rust", "swift", "kotlin", "dart", "bash",
    # Frontend
    "react", "angular", "vue", "html", "css", "redux", "next.js",
    # Backend / APIs
    "node.js", "express", "django", "flask", "fastapi", "spring", "rest api", "graphql",
    # Data / ML
    "machine learning", "deep learning", "nlp", "bert", "spacy",
    "tensorflow", "pytorch", "scikit-learn", "pandas", "numpy",
    # Databases
    "mongodb", "sql", "postgresql", "mysql", "firebase", "oracle db", "redis",
    # Cloud / DevOps
    "docker", "kubernetes", "aws", "gcp", "azure", "git", "linux", "ci/cd",
    # Security / Networking
    "cybersecurity", "networking",
    # Other
    "agile", "scrum",
]

DEGREE_KEYWORDS = ["bsc","msc","phd","bachelor","master","doctorate","b.eng","m.eng","ba","ma","hnd"]


def normalize_text(text: str) -> str:
    """Expand abbreviations to canonical skill names using word-boundary regex."""
    normalized = text.lower()
    for pattern, replacement in SKILL_ALIASES.items():
        normalized = re.sub(pattern, replacement, normalized, flags=re.IGNORECASE)
    return normalized


def extract_email(text: str) -> str | None:
    m = re.search(r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}", text)
    return m.group(0) if m else None


def extract_phone(text: str) -> str | None:
    m = re.search(r"(\+?\d[\d\s\-().]{7,}\d)", text)
    return m.group(0).strip() if m else None


def extract_skills(text: str) -> List[str]:
    normalized = normalize_text(text)
    found = []
    for skill in SKILLS_KB:
        pattern = r'\b' + re.escape(skill) + r'\b'
        if re.search(pattern, normalized):
            found.append(skill)
    return found


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
