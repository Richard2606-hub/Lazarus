import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

import models
from database import Base, get_db
from main import app


@pytest.fixture()
def session_factory():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    factory = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    with factory() as seed_db:
        seed_db.add_all(
            [
                models.FailureRecord(
                    title="Linear probing failed to generalize",
                    authors="Test Author",
                    abstract="Linear classifiers failed on external sensor data.",
                    method_description="Linear probing of frozen sensor representations.",
                    source_type="preprint_withdrawal",
                    source_url="https://example.com/test/verified",
                    stated_reason="The method did not generalize.",
                    failure_cause_tag="Lack of Generalization",
                    classification_confidence=0.9,
                    system_verified=True,
                ),
                models.FailureRecord(
                    title="Ambiguous sparse event detector",
                    authors="Test Reviewer",
                    abstract="Sparse event detection with weak supervision.",
                    method_description="Weakly supervised time-series event detection.",
                    source_type="preprint_withdrawal",
                    source_url="https://example.com/test/pending",
                    stated_reason="Withdrawn without a stated reason.",
                    failure_cause_tag="Ambiguous / Unknown",
                    classification_confidence=0.4,
                    system_verified=False,
                ),
            ]
        )
        seed_db.commit()
    yield factory
    engine.dispose()


@pytest.fixture()
def client(session_factory):
    def override_get_db():
        db = session_factory()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


def test_health_check(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}


def test_graveyard_query_ranks_matching_record(client):
    response = client.post(
        "/api/graveyard/query",
        json={"query_text": "linear probing for external sensor data"},
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload[0]["record"]["title"] == "Linear probing failed to generalize"
    assert payload[0]["match_confidence"] > 0.5


def test_graveyard_returns_empty_array_for_no_overlap(client):
    response = client.post(
        "/api/graveyard/query",
        json={"query_text": "quantum entanglement in photonic cavities"},
    )
    assert response.status_code == 200
    assert response.json() == []


def test_graveyard_excludes_single_generic_token_overlap(client):
    response = client.post(
        "/api/graveyard/query",
        json={"query_text": "implicit representations for unrelated astronomy imaging"},
    )
    assert response.status_code == 200
    assert response.json() == []


def test_necromancer_includes_pending_leads_with_visible_record_status(client):
    response = client.post(
        "/api/necromancer/query",
        json={"query_text": "weak supervision for sparse event detection"},
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload[0]["record"]["system_verified"] is False
    assert "lexical structural proxy" in payload[0]["explanation"]


@pytest.mark.parametrize("query", ["tiny", "             "])
def test_query_validation_rejects_trivial_input(client, query):
    response = client.post("/api/graveyard/query", json={"query_text": query})
    assert response.status_code == 422


def test_query_validation_rejects_oversized_input(client):
    response = client.post(
        "/api/graveyard/query", json={"query_text": "x" * 2001}
    )
    assert response.status_code == 422


def test_system_status_discloses_bounded_corpus_and_counts(client):
    response = client.get("/api/status")
    assert response.status_code == 200
    payload = response.json()
    assert payload["mode"] == "prototype"
    assert payload["corpus_size"] == 2
    assert payload["verified_records"] == 1
    assert payload["pending_review"] == 1
    assert payload["completed_reviews"] == 0
    assert "bounded" in payload["coverage_note"].lower()


def test_taxonomy_exposes_fixed_tags_and_threshold(client):
    response = client.get("/api/taxonomy")
    assert response.status_code == 200
    assert "Lack of Generalization" in response.json()["tags"]
    assert response.json()["confidence_threshold"] == 0.8


def test_verification_queue_only_contains_pending_records(client):
    response = client.get("/api/verification/queue")
    assert response.status_code == 200
    payload = response.json()
    assert len(payload) == 1
    assert payload[0]["system_verified"] is False


def test_reviewer_can_confirm_and_audit_pending_item(client):
    record_id = client.get("/api/verification/queue").json()[0]["id"]
    response = client.post(
        f"/api/verification/{record_id}/decision",
        json={
            "decision": "confirm",
            "rationale": "The withdrawal notice directly supports this classification.",
        },
    )
    assert response.status_code == 200
    assert response.json()["decision"] == "confirm"
    assert client.get("/api/verification/queue").json() == []
    history = client.get("/api/verification/history").json()
    assert history[0]["failure_record_id"] == record_id
    assert history[0]["decision"] == "confirm"
    assert "directly supports" in history[0]["rationale"]


def test_reviewer_can_reject_pending_item(client):
    record_id = client.get("/api/verification/queue").json()[0]["id"]
    response = client.post(
        f"/api/verification/{record_id}/decision",
        json={
            "decision": "reject",
            "rationale": "The notice is ambiguous and does not establish a method failure.",
        },
    )
    assert response.status_code == 200
    assert response.json()["decision"] == "reject"
    assert client.get("/api/verification/queue").json() == []
    assert client.get("/api/status").json()["searchable_records"] == 1


def test_review_rejects_short_rationale(client):
    record_id = client.get("/api/verification/queue").json()[0]["id"]
    response = client.post(
        f"/api/verification/{record_id}/decision",
        json={"decision": "reject", "rationale": "No"},
    )
    assert response.status_code == 422


def test_review_rejects_unknown_or_already_decided_item(client):
    missing = client.post(
        "/api/verification/999/decision",
        json={"decision": "reject", "rationale": "No matching review item exists."},
    )
    assert missing.status_code == 404

    verified_record = client.post(
        "/api/verification/1/decision",
        json={"decision": "confirm", "rationale": "Already verified by the system."},
    )
    assert verified_record.status_code == 409
