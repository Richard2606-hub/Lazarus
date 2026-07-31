import os
import google.generativeai as genai
from typing import Tuple, Optional
from dotenv import load_dotenv

load_dotenv()

genai.configure(api_key=os.environ.get("GEMINI_API_KEY"))
model = genai.GenerativeModel("gemini-3.5-flash-lite")

def classify_failure(record: dict) -> Tuple[str, str, float]:
    """
    Classifies the failure reason based on abstract.
    Returns a tuple of (method_description, failure_cause_tag, confidence_score).
    """
    abstract = record.get("abstract", "")
    
    prompt = f"""
    Analyze the following scientific abstract of a retracted paper:
    "{abstract[:2000]}"
    
    1. Extract a short description of the core method or structural approach used in the paper (1-2 sentences). If unclear, just say "Unknown method".
    2. Classify the likely reason for failure/retraction into one of these categories based on common retraction causes: 
    - Lack of Generalization
    - Fundamental Methodological Flaw
    - Data Availability Collapse
    - Superseded by Better Approach
    - Ambiguous / Unknown
    
    Respond in EXACTLY this format: "MethodDescription|Category|Confidence"
    Example: "Used linear probing on resnet|Fundamental Methodological Flaw|0.9"
    """
    
    try:
        response = model.generate_content(prompt)
        result = response.text.strip().split('|')
        if len(result) >= 3:
            return (result[0].strip(), result[1].strip(), float(result[2].strip()))
    except Exception as e:
        print(f"Gemini API Error: {e}")
        
    return ("Method description unavailable", "Ambiguous / Unknown", 0.4)

