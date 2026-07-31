import os
import google.generativeai as genai
from typing import Tuple, Optional
from dotenv import load_dotenv

load_dotenv()

genai.configure(api_key=os.environ.get("GEMINI_API_KEY"))
model = genai.GenerativeModel("gemini-3.5-flash-lite")

def classify_failure(record: dict) -> Tuple[str, float]:
    """
    Classifies the failure reason based on abstract and stated_reason.
    Returns a tuple of (failure_cause_tag, confidence_score).
    """
    text_to_classify = record.get("stated_reason", "")
    
    prompt = f"""
    Analyze the following scientific failure reason:
    "{text_to_classify}"
    
    Classify it into one of these categories: 
    - Lack of Generalization
    - Fundamental Methodological Flaw
    - Data Availability Collapse
    - Superseded by Better Approach
    - Ambiguous / Unknown
    
    Respond in EXACTLY this format: "Category|Confidence" (e.g. "Lack of Generalization|0.9")
    """
    
    try:
        response = model.generate_content(prompt)
        result = response.text.strip().split('|')
        if len(result) == 2:
            return (result[0].strip(), float(result[1].strip()))
    except Exception as e:
        print(f"Gemini API Error: {e}")
        
    return ("Ambiguous / Unknown", 0.4)
