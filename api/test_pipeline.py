from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

import models
from database import Base
from pipeline.classifier import classify_failure
from pipeline.embedder import get_structural_embedding
from pipeline.ingestion import ingest_failures
from pipeline.verification import verify_and_route


def test_ingestion_records_have_complete_source_provenance():
    records = ingest_failures()
    assert len(records) == 3
    required = {
        "title",
        "authors",
        "abstract",
        "method_description",
        "source_type",
        "source_url",
        "stated_reason",
    }
    assert all(required <= record.keys() for record in records)
    assert len({record["source_url"] for record in records}) == len(records)


def test_classifier_maps_clear_and_ambiguous_reasons():
    clear = classify_failure({"stated_reason": "Method did not generalize."})
    ambiguous = classify_failure({"stated_reason": "Withdrawn by the authors."})
    assert clear == ("Lack of Generalization", 0.9)
    assert ambiguous == ("Ambiguous / Unknown", 0.4)


def test_embedding_is_384_dimensions_and_repeatable():
    text = "Weakly supervised change detection without labels"
    first = get_structural_embedding(text)
    second = get_structural_embedding(text)
    assert len(first) == 384
    assert first == second


def test_verification_threshold_routes_records():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    factory = sessionmaker(bind=engine)
    with factory() as db:
        high = models.FailureRecord(
            title="High confidence",
            authors="Test",
            abstract="Test",
            method_description="Test method",
            source_type="retraction",
            source_url="https://example.com/high",
            stated_reason="Clear flaw",
            failure_cause_tag="Fundamental Methodological Flaw",
            classification_confidence=0.8,
        )
        low = models.FailureRecord(
            title="Low confidence",
            authors="Test",
            abstract="Test",
            method_description="Test method",
            source_type="withdrawal",
            source_url="https://example.com/low",
            stated_reason="Unclear",
            failure_cause_tag="Ambiguous / Unknown",
            classification_confidence=0.79,
        )
        db.add_all([high, low])
        db.commit()
        verify_and_route(high.id, db)
        verify_and_route(low.id, db)
        db.refresh(high)
        db.refresh(low)
        assert high.system_verified is True
        assert low.system_verified is False
    engine.dispose()
