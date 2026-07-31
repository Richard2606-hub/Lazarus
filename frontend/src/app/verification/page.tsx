"use client";

import { useCallback, useEffect, useState } from "react";
import { AppHeader } from "@/components/app-header";
import {
  decideVerification,
  FailureRecord,
  getVerificationHistory,
  getVerificationQueue,
  ReviewHistoryItem,
} from "@/lib/api";

export default function Verification() {
  const [queue, setQueue] = useState<FailureRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [rationales, setRationales] = useState<Record<number, string>>({});
  const [history, setHistory] = useState<ReviewHistoryItem[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadQueue = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setQueue(await getVerificationQueue());
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "The reviewer queue could not be loaded.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    Promise.all([getVerificationQueue(), getVerificationHistory()])
      .then(([records, decisions]) => {
        if (!cancelled) {
          setQueue(records);
          setHistory(decisions);
        }
      })
      .catch((requestError: unknown) => {
        if (!cancelled) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : "The reviewer queue could not be loaded.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleDecision(id: number, decision: "confirm" | "reject") {
    const rationale = rationales[id]?.trim() ?? "";
    if (rationale.length < 8) {
      setError("Add a short evidence-based rationale before recording a decision.");
      return;
    }
    setActiveId(id);
    setError("");
    setMessage("");
    try {
      const response = await decideVerification(id, decision, rationale);
      setQueue((currentQueue) => currentQueue.filter((item) => item.id !== id));
      setHistory((current) => [
        {
          id: Date.now(),
          failure_record_id: id,
          decision,
          rationale,
          created_at: new Date().toISOString(),
        },
        ...current,
      ]);
      setMessage(response.message);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "The review decision could not be saved.",
      );
    } finally {
      setActiveId(null);
    }
  }

  return (
    <div className="page-shell animate-fade-in">
      <AppHeader section="Verification Exchange" />
      <main className="workspace">
        <section className="workspace-intro reviewer-intro">
          <div>
            <p className="eyebrow">Human-in-the-loop review</p>
            <h1>Resolve uncertainty with source context.</h1>
            <p>
              Review proposed classifications conservatively. Confirm only when the
              stated source supports the tag; reject when the evidence is ambiguous or
              the cause is misrepresented.
            </p>
          </div>
          <div className="queue-stat" aria-label={`${queue.length} records pending`}>
            <strong>{loading ? "—" : queue.length}</strong>
            <span>records pending</span>
          </div>
        </section>

        <div className="review-guidance">
          <strong>Review standard</strong>
          <span>Check provenance</span>
          <span>Distinguish misconduct from method failure</span>
          <span>Reject unsupported inference</span>
        </div>

        <p className="success-message" role="status" aria-live="polite">{message}</p>
        <p className="form-error" role="alert" aria-live="polite">{error}</p>

        {loading ? (
          <div className="empty-state"><strong>Loading reviewer queue…</strong></div>
        ) : queue.length === 0 ? (
          <div className="empty-state empty-state-success">
            <strong>The reviewer queue is clear.</strong>
            <p>All currently available low-confidence records have been decided.</p>
            <button type="button" className="text-button" onClick={() => void loadQueue()}>
              Refresh queue
            </button>
          </div>
        ) : (
          <div className="review-list">
            {queue.map((item) => (
              <article key={item.id} className="review-card">
                <div className="result-card-topline">
                  <span className="source-type">{item.source_type.replaceAll("_", " ")}</span>
                  <span className="confidence pending">
                    Model confidence · {Math.round((item.classification_confidence ?? 0) * 100)}%
                  </span>
                </div>
                <h2>{item.title}</h2>
                <p className="result-authors">{item.authors}</p>

                <dl className="review-context">
                  <div><dt>Proposed tag</dt><dd>{item.failure_cause_tag ?? "Unclassified"}</dd></div>
                  <div><dt>Method context</dt><dd>{item.method_description}</dd></div>
                  <div><dt>Stated source reason</dt><dd>{item.stated_reason}</dd></div>
                </dl>

                <label className="rationale-field" htmlFor={`rationale-${item.id}`}>
                  <strong>Evidence-based rationale</strong>
                  <span>Required for the audit trail. Note what the source does or does not support.</span>
                  <textarea
                    id={`rationale-${item.id}`}
                    rows={3}
                    maxLength={1000}
                    value={rationales[item.id] ?? ""}
                    onChange={(event) =>
                      setRationales((current) => ({ ...current, [item.id]: event.target.value }))
                    }
                    placeholder="Example: The withdrawal notice does not identify a methodological cause."
                  />
                </label>

                <div className="review-actions">
                  <a href={item.source_url} target="_blank" rel="noreferrer" className="source-link">
                    Open source <span aria-hidden="true">↗</span>
                  </a>
                  <div>
                    <button
                      type="button"
                      className="button button-reject"
                      disabled={activeId === item.id || (rationales[item.id]?.trim().length ?? 0) < 8}
                      onClick={() => void handleDecision(item.id, "reject")}
                    >
                      Reject classification
                    </button>
                    <button
                      type="button"
                      className="button button-success"
                      disabled={activeId === item.id || (rationales[item.id]?.trim().length ?? 0) < 8}
                      onClick={() => void handleDecision(item.id, "confirm")}
                    >
                      {activeId === item.id ? "Saving…" : "Confirm classification"}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        <section className="review-history" aria-labelledby="review-history-title">
          <div className="results-heading">
            <div>
              <span className="step-label">Feedback loop</span>
              <h2 id="review-history-title">Recent verification decisions</h2>
            </div>
            <p>{history.length} decisions logged</p>
          </div>
          {history.length === 0 ? (
            <div className="empty-state"><strong>No review decisions have been logged yet.</strong></div>
          ) : (
            <ol className="history-list">
              {history.slice(0, 8).map((item) => (
                <li key={item.id}>
                  <span className={item.decision === "confirm" ? "decision-confirm" : "decision-reject"}>
                    {item.decision === "confirm" ? "Confirmed" : "Rejected"}
                  </span>
                  <p>{item.rationale}</p>
                  <time dateTime={item.created_at}>{new Date(item.created_at).toLocaleString()}</time>
                </li>
              ))}
            </ol>
          )}
        </section>
      </main>
    </div>
  );
}
