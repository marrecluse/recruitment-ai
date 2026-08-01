from pydantic import BaseModel
from typing import List, Optional

class MatchRequest(BaseModel):
    resume_profile: dict
    job_description: str

class MatchResponse(BaseModel):
    score: float
    matched_skills: List[str]
    missing_skills: List[str]
    explanation: str
    model_used: str
