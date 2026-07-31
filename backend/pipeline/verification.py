from sqlalchemy.orm import Session
from models import FailureRecord

CONFIDENCE_THRESHOLD = 0.8

def verify_and_route(record_id: int, db: Session):
    """
    Checks confidence scores and sets system_verified if above threshold.
    Otherwise leaves it for manual review.
    """
    record = db.query(FailureRecord).filter(FailureRecord.id == record_id).first()
    if not record:
        return
        
    if record.classification_confidence and record.classification_confidence >= CONFIDENCE_THRESHOLD:
        record.system_verified = True
    else:
        record.system_verified = False
        
    db.commit()
