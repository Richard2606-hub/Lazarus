from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator

class FailureRecordBase(BaseModel):
    title: str
    authors: str
    abstract: str
    method_description: str
    source_type: str
    source_url: str
    stated_reason: str

class FailureRecordCreate(FailureRecordBase):
    pass

class FailureRecord(FailureRecordBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    failure_cause_tag: Optional[str] = None
    classification_confidence: Optional[float] = None
    system_verified: bool = False

class QueryRequest(BaseModel):
    query_text: str = Field(min_length=12, max_length=2000)

    @field_validator("query_text")
    @classmethod
    def normalize_query(cls, value: str) -> str:
        normalized = " ".join(value.split())
        if len(normalized) < 12:
            raise ValueError("Describe the method and context in at least 12 characters")
        return normalized

class GraveyardMatch(BaseModel):
    record: FailureRecord
    match_confidence: float

class NecromancerMatch(BaseModel):
    record: FailureRecord
    explanation: str
    match_confidence: float
    topical_distance: Optional[float] = None

class ReviewDecision(BaseModel):
    decision: Literal["confirm", "reject"]
    rationale: str = Field(min_length=8, max_length=1000)

    @field_validator("rationale")
    @classmethod
    def normalize_rationale(cls, value: str) -> str:
        normalized = " ".join(value.split())
        if len(normalized) < 8:
            raise ValueError("Provide a short evidence-based rationale")
        return normalized

class ReviewDecisionResponse(BaseModel):
    id: int
    decision: Literal["confirm", "reject"]
    message: str


class ReviewHistoryItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    failure_record_id: int
    decision: Literal["confirm", "reject"]
    rationale: str
    created_at: datetime


class FailureTaxonomy(BaseModel):
    tags: list[str]
    confidence_threshold: float

class SystemStatus(BaseModel):
    mode: Literal["prototype"] = "prototype"
    corpus_size: int
    searchable_records: int
    verified_records: int
    pending_review: int
    completed_reviews: int
    coverage_note: str
