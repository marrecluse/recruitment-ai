from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from .models import MatchRequest, MatchResponse
from .matcher import match, MODEL_MODE

app = FastAPI(title="Job Matcher API", version="1.0.0",
              description="Faisal Arbab — Semantic Job Matching")

app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

@app.get("/health")
def health():
    return {"status": "ok", "service": "nlp-matcher", "model": MODEL_MODE}

@app.post("/match", response_model=MatchResponse)
def run_match(req: MatchRequest):
    try:
        score, matched, missing, explanation = match(req.resume_profile, req.job_description)
        return MatchResponse(
            score=round(score, 4),
            matched_skills=matched,
            missing_skills=missing,
            explanation=explanation,
            model_used=MODEL_MODE,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
