import sys
import os

# Add backend directory to sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal, engine
import models
from pipeline.scraper import fetch_retracted_papers
from pipeline.classifier import classify_failure
from pipeline.embedder import get_structural_embedding, get_topic_embedding
from pipeline.verification import verify_and_route

# Ensure tables are created
models.Base.metadata.create_all(bind=engine)

def main():
    db = SessionLocal()
    print("Ingesting records from Crossref...")
    records = fetch_retracted_papers(limit=50)
    
    for rec in records:
        safe_title = rec['title'].encode('ascii', 'replace').decode('ascii')
        print(f"Processing record: {safe_title}")
        
        # Check if it already exists
        existing = db.query(models.FailureRecord).filter_by(source_url=rec["source_url"]).first()
        if existing:
            print("Record already exists. Skipping.")
            continue
            
        # Classify failure and extract method description using Gemini
        method_desc, cause, confidence = classify_failure(rec)
        rec["method_description"] = method_desc
        
        # Embed structure and topic
        structural_emb = get_structural_embedding(rec["method_description"])
        topic_emb = get_topic_embedding(rec.get("abstract", rec["title"]))
        
        # Create database entry
        db_record = models.FailureRecord(
            title=rec["title"],
            authors=rec["authors"],
            abstract=rec["abstract"],
            method_description=rec["method_description"],
            source_type=rec["source_type"],
            source_url=rec["source_url"],
            stated_reason=rec["stated_reason"],
            failure_cause_tag=cause,
            classification_confidence=confidence
        )
        
        if models.HAS_PGVECTOR:
            db_record.structural_embedding = structural_emb
            db_record.domain_topic_embedding = topic_emb
            
        db.add(db_record)
        db.commit()
        db.refresh(db_record)
        
        # Verify and route
        verify_and_route(db_record.id, db)
        
    print("Ingestion complete.")
    db.close()

if __name__ == "__main__":
    main()
