"use client";

import { FormEvent, useState } from "react";
import { AppHeader } from "@/components/app-header";
import { PrototypeNote } from "@/components/prototype-note";
import { SavedSearches } from "@/components/saved-searches";
import { NecromancerMatch, queryNecromancer } from "@/lib/api";

const EXAMPLE_QUERY =
  "Detect gradual distribution drift in noisy sensor representations without labelled examples";

export default function Necromancer() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<NecromancerMatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");

  async function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedQuery = query.trim();
    if (normalizedQuery.length < 12) {
      setError("Describe the problem and its constraints in at least 12 characters.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      setResults(await queryNecromancer(normalizedQuery));
      setSearched(true);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "The Lazarus API could not be reached.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-shell animate-fade-in">
      <AppHeader section="Citation Necromancer" />
      <main className="workspace">
        <section className="workspace-intro">
          <div>
            <p className="eyebrow">Cross-domain discovery</p>
            <h1>Search by the shape of the problem.</h1>
            <p>
              Describe the constraint structure of a stuck problem. Lazarus surfaces
              method-level candidates and explains why each one may be relevant.
            </p>
          </div>
          <PrototypeNote />
        </section>

        <section className="query-panel query-panel-accent" aria-labelledby="necromancer-query-title">
          <div className="query-panel-heading">
            <div>
              <span className="step-label">Step 1 of 2</span>
              <h2 id="necromancer-query-title">Describe the stuck problem</h2>
            </div>
            <button type="button" className="text-button" onClick={() => setQuery(EXAMPLE_QUERY)}>
              Use an example
            </button>
          </div>
          <form onSubmit={handleSearch}>
            <label htmlFor="necromancer-query" className="sr-only">Stuck research problem</label>
            <textarea
              id="necromancer-query"
              className="query-input"
              placeholder="Example: Detect gradual distribution drift in noisy sensor data without labelled examples..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              minLength={12}
              maxLength={2000}
              rows={5}
              required
            />
            <div className="form-footer">
              <span>{query.length} / 2,000 characters</span>
              <button type="submit" className="button button-accent" disabled={loading}>
                {loading ? "Comparing methods…" : "Find analogous methods"}
              </button>
            </div>
          </form>
          <p className="form-error" role="alert" aria-live="polite">{error}</p>
          <SavedSearches
            storageKey="lazarus:necromancer-searches"
            currentQuery={query}
            onSelect={setQuery}
          />
        </section>

        <section className="results-section" aria-live="polite" aria-busy={loading}>
          {searched && (
            <div className="results-heading">
              <div>
                <span className="step-label">Step 2 of 2</span>
                <h2>{results.length} structural {results.length === 1 ? "lead" : "leads"}</h2>
              </div>
              <p>Researcher judgement remains essential</p>
            </div>
          )}

          {searched && results.length === 0 && (
            <div className="empty-state">
              <strong>No analogous method was found in the bounded prototype corpus.</strong>
              <p>Try describing the inputs, constraints, objective, and missing labels.</p>
            </div>
          )}

          <div className="result-list">
            {results.map(({ record, explanation, match_confidence }) => (
              <article key={record.id} className="result-card result-card-accent">
                <div className="result-card-topline">
                  <span className="source-type">Cross-domain candidate</span>
                  <span className={record.system_verified ? "confidence verified" : "confidence pending"}>
                    {record.system_verified ? "System verified" : "Pending human review"} · {Math.round(match_confidence * 100)}%
                  </span>
                </div>
                <h3>{record.title}</h3>
                <p className="result-authors">{record.authors}</p>
                <div className="explanation-box">
                  <strong>Why Lazarus surfaced this</strong>
                  <p>{explanation}</p>
                </div>
                <details className="result-context">
                  <summary>View candidate method context</summary>
                  <div>
                    <strong>Method</strong>
                    <p>{record.method_description}</p>
                    <strong>Source field context</strong>
                    <p>{record.abstract}</p>
                  </div>
                </details>
                <a href={record.source_url} target="_blank" rel="noreferrer" className="source-link">
                  Inspect candidate source <span aria-hidden="true">↗</span>
                </a>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
