from datetime import datetime, timezone

from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship
from database import Base
# Note: For pgvector, we would use Vector type. For SQLite mockup, we might use JSON or skip vectors temporarily.
try:
    from pgvector.sqlalchemy import Vector
    HAS_PGVECTOR = True
except ImportError:
    HAS_PGVECTOR = False

class FailureRecord(Base):
    __tablename__ = "failure_records"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    authors = Column(String)
    abstract = Column(Text)
    method_description = Column(Text)
    source_type = Column(String) # retraction, preprint_withdrawal, abandoned_repo
    source_url = Column(String)
    stated_reason = Column(Text) # Original stated reason
    
    # Classification results
    failure_cause_tag = Column(String, index=True)
    classification_confidence = Column(Float)
    system_verified = Column(Boolean, default=False)
    
    if HAS_PGVECTOR:
        # Embedding of the method structure
        structural_embedding = Column(Vector(384)) # e.g. using all-MiniLM-L6-v2 which is 384 dims
        # Embedding of the problem domain topic for topological exclusion
        domain_topic_embedding = Column(Vector(384))

    review_decisions = relationship(
        "ReviewDecision",
        back_populates="record",
        cascade="all, delete-orphan",
    )


class ReviewDecision(Base):
    """Immutable audit record for a human verification decision."""

    __tablename__ = "review_decisions"

    id = Column(Integer, primary_key=True, index=True)
    failure_record_id = Column(
        Integer,
        ForeignKey("failure_records.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    decision = Column(String, nullable=False)
    rationale = Column(Text, nullable=False)
    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )

    record = relationship("FailureRecord", back_populates="review_decisions")
