"use client";

import { useEffect, useState } from "react";
import { getSystemStatus, SystemStatus } from "@/lib/api";

export function SystemStatusPanel() {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getSystemStatus()
      .then((value) => {
        if (!cancelled) setStatus(value);
      })
      .catch(() => {
        if (!cancelled) setUnavailable(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="status-panel" aria-labelledby="status-title">
      <div>
        <p className="eyebrow">Live prototype status</p>
        <h2 id="status-title">A bounded corpus, reported honestly.</h2>
        <p className="status-copy">
          {status?.coverage_note ??
            "Coverage is intentionally bounded. Connect the API to view current corpus counts."}
        </p>
        {unavailable && (
          <span className="api-status api-status-offline">API offline</span>
        )}
      </div>
      <dl className="status-metrics" aria-label="Corpus status">
        <div><dt>Searchable</dt><dd>{status?.searchable_records ?? "—"}</dd></div>
        <div><dt>Verified</dt><dd>{status?.verified_records ?? "—"}</dd></div>
        <div><dt>Awaiting review</dt><dd>{status?.pending_review ?? "—"}</dd></div>
        <div><dt>Reviews logged</dt><dd>{status?.completed_reviews ?? "—"}</dd></div>
      </dl>
    </section>
  );
}
