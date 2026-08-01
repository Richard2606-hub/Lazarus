export type FailureRecord = {
  id: number;
  title: string;
  authors: string;
  abstract: string;
  method_description: string;
  source_type: string;
  source_url: string;
  stated_reason: string;
  failure_cause_tag: string | null;
  classification_confidence: number | null;
  system_verified: boolean;
};

export type GraveyardMatch = {
  record: FailureRecord;
  match_confidence: number;
};

export type NecromancerMatch = GraveyardMatch & {
  explanation: string;
  topical_distance?: number;
};

export type SystemStatus = {
  mode: "prototype";
  corpus_size: number;
  searchable_records: number;
  verified_records: number;
  pending_review: number;
  completed_reviews: number;
  coverage_note: string;
};

export type ReviewHistoryItem = {
  id: number;
  failure_record_id: number;
  decision: "confirm" | "reject";
  rationale: string;
  created_at: string;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 12_000);
  let response: Response;

  try {
    response = await fetch(`${API_URL}${path}`, {
      ...init,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...init?.headers,
      },
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("The Lazarus API took too long to respond. Please try again.");
    }
    throw new Error("The Lazarus API could not be reached. Check that the backend is running.");
  } finally {
    window.clearTimeout(timeout);
  }

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as
      | { detail?: string | Array<{ msg?: string }> }
      | null;
    const detail = Array.isArray(payload?.detail)
      ? payload.detail.map((item) => item.msg).filter(Boolean).join(" ")
      : payload?.detail;
    throw new Error(detail || `Request failed with status ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export function queryGraveyard(queryText: string) {
  return request<GraveyardMatch[]>("/api/graveyard/query", {
    method: "POST",
    body: JSON.stringify({ query_text: queryText }),
  });
}

export function queryNecromancer(queryText: string) {
  return request<NecromancerMatch[]>("/api/necromancer/query", {
    method: "POST",
    body: JSON.stringify({ query_text: queryText }),
  });
}

export function getVerificationQueue() {
  return request<FailureRecord[]>("/api/verification/queue");
}

export function decideVerification(
  id: number,
  decision: "confirm" | "reject",
  rationale: string,
) {
  return request<{ id: number; decision: string; message: string }>(
    `/api/verification/${id}/decision`,
    {
      method: "POST",
      body: JSON.stringify({ decision, rationale }),
    },
  );
}

export function getSystemStatus() {
  return request<SystemStatus>("/api/status");
}

export function getVerificationHistory() {
  return request<ReviewHistoryItem[]>("/api/verification/history");
}
