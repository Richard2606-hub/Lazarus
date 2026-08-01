from sentence_transformers import SentenceTransformer
import numpy as np
import hashlib
import os

# Load the structural embedding model
# We use a small local model for the prototype
try:
    model = SentenceTransformer('all-MiniLM-L6-v2')
except Exception as e:
    model = None

def get_structural_embedding(text: str) -> list[float]:
    """
    Returns the structural embedding for a given method description.
    """
    if model is None:
        # Deterministic local fallback: repeatable across ingestion runs and tests.
        digest = hashlib.sha256(text.encode("utf-8")).digest()
        seed = int.from_bytes(digest[:8], "big", signed=False)
        return np.random.default_rng(seed).random(384).tolist()
    
    # Encode and return as list of floats
    embedding = model.encode(text)
    return embedding.tolist()

def get_topic_embedding(text: str) -> list[float]:
    """
    Returns the domain topic embedding for a given abstract.
    This is used for topical exclusion (finding structurally similar methods in DIFFERENT domains).
    """
    if model is None:
        # Deterministic local fallback
        digest = hashlib.sha256(("topic" + text).encode("utf-8")).digest()
        seed = int.from_bytes(digest[:8], "big", signed=False)
        return np.random.default_rng(seed).random(384).tolist()
    
    embedding = model.encode(text)
    return embedding.tolist()
