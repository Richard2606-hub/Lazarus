import { FailureRecord } from "@/lib/api";

export const verifiedRecord: FailureRecord = {
  id: 1,
  title: "Linear probing failed to generalize",
  authors: "Test Author",
  abstract: "Linear classifiers failed on external sensor data.",
  method_description: "Linear probing of frozen sensor representations.",
  source_type: "preprint_withdrawal",
  source_url: "https://example.com/verified",
  stated_reason: "The method did not generalize.",
  failure_cause_tag: "Lack of Generalization",
  classification_confidence: 0.9,
  system_verified: true,
};

export const pendingRecord: FailureRecord = {
  id: 2,
  title: "Ambiguous sparse event detector",
  authors: "Test Reviewer",
  abstract: "Sparse event detection with weak supervision.",
  method_description: "Weakly supervised time-series event detection.",
  source_type: "preprint_withdrawal",
  source_url: "https://example.com/pending",
  stated_reason: "Withdrawn without a stated reason.",
  failure_cause_tag: "Ambiguous / Unknown",
  classification_confidence: 0.4,
  system_verified: false,
};
