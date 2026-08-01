from pydantic import BaseModel
from typing import List, Optional

class ParseRequest(BaseModel):
    resume_id: str
    text: str

class CandidateProfile(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    skills: List[str] = []
    degrees: List[str] = []
    institutions: List[str] = []
    job_titles: List[str] = []
    companies: List[str] = []

class ParseResponse(BaseModel):
    resume_id: str
    profile: CandidateProfile
    model_used: str
