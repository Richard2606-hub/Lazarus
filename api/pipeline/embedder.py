import os
import hashlib
import numpy as np
import google.generativeai as genai

# Setup Gemini model
genai.configure(api_key=os.environ.get("GEMINI_API_KEY", ""))

def _get_gemini_embedding(text: str, task_type: str = "retrieval_document") -> list[float]:
    """
    Helper to fetch embeddings from Gemini API.
    Uses output_dimensionality=384 to perfectly match the existing PGVector schema.
    """
    if not os.environ.get("GEMINI_API_KEY"):
        # Deterministic local fallback: repeatable across ingestion runs and tests.
        digest = hashlib.sha256((task_type + text).encode("utf-8")).digest()
        seed = int.from_bytes(digest[:8], "big", signed=False)
        return np.random.default_rng(seed).random(384).tolist()

    try:
        result = genai.embed_content(
            model="models/text-embedding-004",
            content=text,
            task_type=task_type,
            output_dimensionality=384
        )
        return result['embedding']
    except Exception as e:
        print(f"Gemini Embedding Error: {e}")
        # Fallback to random hash on API error
        digest = hashlib.sha256((task_type + text).encode("utf-8")).digest()
        seed = int.from_bytes(digest[:8], "big", signed=False)
        return np.random.default_rng(seed).random(384).tolist()

def get_structural_embedding(text: str) -> list[float]:
    """
    Returns the structural embedding for a given method description.
    """
    return _get_gemini_embedding(text, task_type="semantic_similarity")

def get_topic_embedding(text: str) -> list[float]:
    """
    Returns the domain topic embedding for a given abstract.
    This is used for topical exclusion (finding structurally similar methods in DIFFERENT domains).
    """
    return _get_gemini_embedding(text, task_type="retrieval_document")
