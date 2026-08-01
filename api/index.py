import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import re
from collections.abc import Iterable

from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List

import models
import schemas
from database import engine, get_db
from pipeline.verification import CONFIDENCE_THRESHOLD
from pipeline.embedder import get_structural_embedding, get_topic_embedding
import google.generativeai as genai

# Setup Gemini model
genai.configure(api_key=os.environ.get("GEMINI_API_KEY", ""))
gemini_model = genai.GenerativeModel("gemini-3.5-flash-lite")

def _generate_explanation(query_text: str, record_method: str) -> str:
    prompt = f"""
    The user is trying to solve a problem: "{query_text}"
    We found a candidate method from a different domain: "{record_method}"
    
    Explain in 2-3 sentences why this candidate method's underlying structure might be relevant to the user's problem, despite being from a different domain. Do not invent facts, just focus on the structural/methodological similarity.
    """
    try:
        if not os.environ.get("GEMINI_API_KEY"):
            return "Gemini API key not configured. Explanation generation is disabled."
        response = gemini_model.generate_content(prompt)
        return response.text.strip()
    except Exception as e:
        print(f"Gemini Explanation Error: {e}")
        return "Explanation could not be generated due to API error."

# models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Lazarus API")

# Allow CORS for development and deployed frontend
frontend_url = os.environ.get("FRONTEND_URL", "http://localhost:3000")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", frontend_url],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

STOP_WORDS = {
    "a", "an", "and", "are", "as", "at", "be", "by", "for", "from",
    "i", "in", "is", "it", "my", "of", "on", "or", "that", "the",
    "their", "this", "to", "using", "with", "without",
}

FAILURE_TAXONOMY = [
    "Fundamental Methodological Flaw",
    "Insufficient Effect Size",
    "Data Availability Collapse",
    "Lack of Generalization",
    "Superseded by Better Approach",
    "Ambiguous / Unknown",
]


def _tokens(text: str) -> set[str]:
    return {
        token
        for token in re.findall(r"[a-z0-9]+", text.lower())
        if len(token) > 2 and token not in STOP_WORDS
    }


def _record_text(record: models.FailureRecord) -> str:
    return " ".join(
        filter(
            None,
            [
                record.title,
                record.abstract,
                record.method_description,
                record.stated_reason,
                record.failure_cause_tag,
            ],
        )
    )


def _rank_records(
    query_text: str, records: Iterable[models.FailureRecord]
) -> list[tuple[models.FailureRecord, float]]:
    query_tokens = _tokens(query_text)
    ranked: list[tuple[models.FailureRecord, float]] = []

    for record in records:
        record_tokens = _tokens(_record_text(record))
        overlap = len(query_tokens & record_tokens)
        minimum_overlap = 2 if len(query_tokens) >= 4 else 1
        if overlap < minimum_overlap:
            continue

        coverage = overlap / max(len(query_tokens), 1)
        specificity = overlap / max(min(len(record_tokens), 12), 1)
        score = min(0.98, 0.35 + (coverage * 0.45) + (specificity * 0.2))
        ranked.append((record, round(score, 2)))

    return sorted(ranked, key=lambda item: item[1], reverse=True)

@app.get("/health")
def health_check():
    return {"status": "healthy"}


@app.get("/api/status", response_model=schemas.SystemStatus)
def get_system_status(db: Session = Depends(get_db)):
    records = db.query(models.FailureRecord)
    rejected_tag = "Rejected by reviewer"
    return schemas.SystemStatus(
        corpus_size=records.count(),
        searchable_records=records.filter(
            models.FailureRecord.failure_cause_tag != rejected_tag
        ).count(),
        verified_records=records.filter(
            models.FailureRecord.system_verified.is_(True),
            models.FailureRecord.failure_cause_tag != rejected_tag,
        ).count(),
        pending_review=records.filter(
            models.FailureRecord.system_verified.is_(False),
            models.FailureRecord.failure_cause_tag != rejected_tag,
        ).count(),
        completed_reviews=db.query(models.ReviewDecision).count(),
        coverage_note=(
            "Bounded demonstration corpus only. An empty result means no match was "
            "found in this prototype corpus, not that the approach has never been tried."
        ),
    )


@app.get("/api/taxonomy", response_model=schemas.FailureTaxonomy)
def get_failure_taxonomy():
    return schemas.FailureTaxonomy(
        tags=FAILURE_TAXONOMY,
        confidence_threshold=CONFIDENCE_THRESHOLD,
    )

@app.post("/api/graveyard/query", response_model=List[schemas.GraveyardMatch])
def query_graveyard(request: schemas.QueryRequest, db: Session = Depends(get_db)):
    records = db.query(models.FailureRecord).filter(
        models.FailureRecord.failure_cause_tag != "Rejected by reviewer"
    ).all()
    return [
        schemas.GraveyardMatch(record=record, match_confidence=score)
        for record, score in _rank_records(request.query_text, records)[:10]
    ]

@app.post("/api/necromancer/query", response_model=List[schemas.NecromancerMatch])
def query_necromancer(request: schemas.QueryRequest, db: Session = Depends(get_db)):
    if models.HAS_PGVECTOR:
        query_structural_emb = get_structural_embedding(request.query_text)
        query_topic_emb = get_topic_embedding(request.query_text)
        
        # Fetch top 20 by structural similarity
        records_with_dist = db.query(
            models.FailureRecord, 
            models.FailureRecord.structural_embedding.cosine_distance(query_structural_emb).label('struct_dist'),
            models.FailureRecord.domain_topic_embedding.cosine_distance(query_topic_emb).label('topic_dist')
        ).filter(
            models.FailureRecord.failure_cause_tag != "Rejected by reviewer"
        ).order_by(
            models.FailureRecord.structural_embedding.cosine_distance(query_structural_emb)
        ).limit(20).all()
        
        # Filter for cross-domain (topic distance > 0.15)
        filtered_records = []
        for r, struct_dist, topic_dist in records_with_dist:
            if topic_dist is not None and topic_dist > 0.15:
                filtered_records.append((r, struct_dist, topic_dist))
                
        # If filtering removed everything, just fallback to structural matches
        if not filtered_records:
            filtered_records = records_with_dist
            
        results = []
        for record, struct_dist, topic_dist in filtered_records[:10]:
            match_confidence = max(0.0, min(1.0, 1.0 - (struct_dist if struct_dist is not None else 0.5)))
            explanation = _generate_explanation(request.query_text, record.method_description)
            results.append(
                schemas.NecromancerMatch(
                    record=record,
                    explanation=explanation,
                    match_confidence=match_confidence,
                    topical_distance=topic_dist
                )
            )
        return results
    else:
        records = db.query(models.FailureRecord).filter(
            models.FailureRecord.failure_cause_tag != "Rejected by reviewer",
        ).all()
        
        results = []
        for record, score in _rank_records(request.query_text, records)[:10]:
            explanation = _generate_explanation(request.query_text, record.method_description)
            results.append(
                schemas.NecromancerMatch(
                    record=record,
                    explanation=explanation,
                    match_confidence=score,
                    topical_distance=None
                )
            )
        return results

@app.get("/api/verification/queue", response_model=List[schemas.FailureRecord])
def get_verification_queue(db: Session = Depends(get_db)):
    return db.query(models.FailureRecord).filter(
        models.FailureRecord.system_verified.is_(False),
        models.FailureRecord.failure_cause_tag != "Rejected by reviewer",
    ).all()


@app.get(
    "/api/verification/history",
    response_model=List[schemas.ReviewHistoryItem],
)
def get_verification_history(db: Session = Depends(get_db)):
    return db.query(models.ReviewDecision).order_by(
        models.ReviewDecision.created_at.desc(),
        models.ReviewDecision.id.desc(),
    ).all()


@app.post(
    "/api/verification/{record_id}/decision",
    response_model=schemas.ReviewDecisionResponse,
)
def decide_verification(
    record_id: int,
    request: schemas.ReviewDecision,
    db: Session = Depends(get_db),
):
    record = db.query(models.FailureRecord).filter(
        models.FailureRecord.id == record_id
    ).first()
    if record is None:
        raise HTTPException(status_code=404, detail="Review item not found")
    if record.system_verified or record.failure_cause_tag == "Rejected by reviewer":
        raise HTTPException(status_code=409, detail="Review item has already been decided")

    if request.decision == "confirm":
        record.system_verified = True
        message = "Record confirmed and added to the verified pool."
    else:
        record.failure_cause_tag = "Rejected by reviewer"
        message = "Record rejected and removed from the review queue."

    db.add(
        models.ReviewDecision(
            failure_record_id=record.id,
            decision=request.decision,
            rationale=request.rationale,
        )
    )

    db.commit()
    return schemas.ReviewDecisionResponse(
        id=record.id,
        decision=request.decision,
        message=message,
    )

@app.delete("/api/verification/{record_id}/decision")
def undo_verification(record_id: int, db: Session = Depends(get_db)):
    record = db.query(models.FailureRecord).filter(
        models.FailureRecord.id == record_id
    ).first()
    if record is None:
        raise HTTPException(status_code=404, detail="Review item not found")

    decision = db.query(models.ReviewDecision).filter(
        models.ReviewDecision.failure_record_id == record_id
    ).first()

    if decision is None:
        raise HTTPException(status_code=404, detail="No review decision found to undo")

    # Reset failure record state
    record.system_verified = False
    if record.failure_cause_tag == "Rejected by reviewer":
        record.failure_cause_tag = None
    
    db.delete(decision)
    db.commit()
    return {"status": "success", "message": "Decision undone successfully"}
