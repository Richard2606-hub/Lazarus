import os
from typing import List, Dict

# Mock Ingestion Pipeline since we do not have actual sources configured yet
# In a real environment, this would fetch from retraction databases and pre-print servers

def ingest_failures() -> List[Dict]:
    """
    Ingests failure records from configured sources.
    Returns a list of dictionaries representing the records.
    """
    return [
        {
            "title": "A failed attempt to use linear probing for X-ray analysis",
            "authors": "Smith, J. et al.",
            "abstract": "We attempted linear probing but it failed to generalize.",
            "method_description": "Using linear probing on pre-trained ResNet features for X-ray classification.",
            "source_type": "preprint_withdrawal",
            "source_url": "https://example.com/preprint/1",
            "stated_reason": "Method did not generalize beyond the validation set."
        },
        {
            "title": "Retraction: Neural implicit representations for fluid dynamics",
            "authors": "Doe, J.",
            "abstract": "The approach fails to conserve mass over long simulations.",
            "method_description": "Training MLPs to represent fluid density fields directly.",
            "source_type": "retraction",
            "source_url": "https://example.com/retraction/2",
            "stated_reason": "Fundamental flaw in conservation constraints."
        },
        {
            "title": "Withdrawn: Weak supervision for sparse clinical event detection",
            "authors": "Lazarus demonstration corpus",
            "abstract": "A withdrawn prototype record with an ambiguous stated cause.",
            "method_description": "Weakly supervised classification of sparse time-series events.",
            "source_type": "preprint_withdrawal",
            "source_url": "https://example.com/preprint/3",
            "stated_reason": "Withdrawn at the authors' request; the available notice does not state a cause."
        }
    ]
