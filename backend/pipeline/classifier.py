from typing import Tuple

# Configure Gemini API if available
# genai.configure(api_key=os.environ["GEMINI_API_KEY"])

def classify_failure(record: dict) -> Tuple[str, float]:
    """
    Classifies the failure reason based on abstract and stated_reason.
    Returns a tuple of (failure_cause_tag, confidence_score).
    """
    # Mocking Gemini classification for local development
    # In reality, we'd prompt Gemini with the failure taxonomy.
    text_to_classify = record.get("stated_reason", "").lower()
    
    if "generalize" in text_to_classify:
        return ("Lack of Generalization", 0.9)
    elif "conservation" in text_to_classify or "flaw" in text_to_classify:
        return ("Fundamental Methodological Flaw", 0.95)
    
    # Fallback
    return ("Ambiguous / Unknown", 0.4)
