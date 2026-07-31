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

# models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Lazarus API")

allowed_origins = [
    origin.strip()
    for origin in os.getenv(
        "ALLOWED_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000"
    ).split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
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
    records = db.query(models.FailureRecord).filter(
        models.FailureRecord.failure_cause_tag != "Rejected by reviewer",
    ).all()
    return [
        schemas.NecromancerMatch(
            record=record,
            explanation=(
                "This candidate shares method-level terms and constraints with the "
                "stated problem. In the prototype, this is a lexical structural proxy; "
                "the proposal's contrastively fine-tuned embedding model remains a "
                "planned production component."
            ),
            match_confidence=score,
        )
        for record, score in _rank_records(request.query_text, records)[:10]
    ]

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
