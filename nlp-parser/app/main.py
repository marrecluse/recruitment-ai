from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from .models import ParseRequest, ParseResponse, CandidateProfile
from .parser import parse_resume, MODEL_MODE

app = FastAPI(title="Resume Parser API", version="1.0.0", description="Sada Bahar — NLP Resume Parsing")

app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

@app.get("/health")
def health():
    return {"status": "ok", "service": "nlp-parser", "model": MODEL_MODE}

@app.post("/parse", response_model=ParseResponse)
def parse(req: ParseRequest):
    if not req.text.strip():
        raise HTTPException(status_code=400, detail="Resume text is empty")
    try:
        profile = parse_resume(req.text)
        return ParseResponse(resume_id=req.resume_id, profile=profile, model_used=MODEL_MODE)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
