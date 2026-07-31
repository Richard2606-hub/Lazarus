"use client";

import { FormEvent, useState } from "react";
import { AppHeader } from "@/components/app-header";
import { PrototypeNote } from "@/components/prototype-note";
import { SavedSearches } from "@/components/saved-searches";
import { GraveyardMatch, queryGraveyard } from "@/lib/api";

const EXAMPLE_QUERY =
  "Using linear probing on frozen representations for external sensor classification";

export default function Graveyard() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GraveyardMatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");

  async function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedQuery = query.trim();
    if (normalizedQuery.length < 12) {
      setError("Describe the method and research context in at least 12 characters.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      setResults(await queryGraveyard(normalizedQuery));
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
      <AppHeader section="The Graveyard" />
      <main className="workspace">
        <section className="workspace-intro">
          <div>
            <p className="eyebrow">Failure intelligence</p>
            <h1>Check before you repeat.</h1>
            <p>
              Describe the method, data, and constraint you plan to use. Lazarus returns
              related failure records with cause tags, source context, and confidence.
            </p>
          </div>
          <PrototypeNote />
        </section>

        <section className="query-panel" aria-labelledby="graveyard-query-title">
          <div className="query-panel-heading">
            <div>
              <span className="step-label">Step 1 of 2</span>
              <h2 id="graveyard-query-title">Describe your planned approach</h2>
            </div>
            <button
              type="button"
              className="text-button"
              onClick={() => setQuery(EXAMPLE_QUERY)}
            >
              Use an example
            </button>
          </div>
          <form onSubmit={handleSearch}>
            <label htmlFor="graveyard-query" className="sr-only">
              Planned research approach
            </label>
            <textarea
              id="graveyard-query"
              className="query-input"
              placeholder="Example: Using linear probing on frozen representations for external sensor classification..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              minLength={12}
              maxLength={2000}
              rows={5}
              required
            />
            <div className="form-footer">
              <span>{query.length} / 2,000 characters</span>
              <button type="submit" className="button button-primary" disabled={loading}>
                {loading ? "Searching corpus…" : "Search failure records"}
              </button>
            </div>
          </form>
          <p className="form-error" role="alert" aria-live="polite">{error}</p>
          <SavedSearches
            storageKey="lazarus:graveyard-searches"
            currentQuery={query}
            onSelect={setQuery}
          />
        </section>

        <section className="results-section" aria-live="polite" aria-busy={loading}>
          {searched && (
            <div className="results-heading">
              <div>
                <span className="step-label">Step 2 of 2</span>
                <h2>{results.length} related failure {results.length === 1 ? "record" : "records"}</h2>
              </div>
              <p>Ranked by prototype query relevance</p>
            </div>
          )}

          {searched && results.length === 0 && (
            <div className="empty-state">
              <strong>No related record was found in this bounded corpus.</strong>
              <p>Try adding the method, data type, failure mode, or key constraint.</p>
            </div>
          )}

          <div className="result-list">
            {results.map(({ record, match_confidence }) => (
              <article key={record.id} className="result-card result-card-danger">
                <div className="result-card-topline">
                  <span className="source-type">{record.source_type.replaceAll("_", " ")}</span>
                  <span className={record.system_verified ? "confidence verified" : "confidence pending"}>
                    {record.system_verified
                      ? `System verified · ${Math.round((record.classification_confidence ?? 0) * 100)}%`
                      : "Pending human review"}
                  </span>
                </div>
                <h3>{record.title}</h3>
                <p className="result-authors">{record.authors}</p>
                <dl className="result-details">
                  <div><dt>Proposed cause</dt><dd>{record.failure_cause_tag ?? "Unclassified"}</dd></div>
                  <div><dt>Query relevance</dt><dd>{Math.round(match_confidence * 100)}%</dd></div>
                </dl>
                <blockquote>{record.stated_reason}</blockquote>
                <details className="result-context">
                  <summary>View method and abstract context</summary>
                  <div>
                    <strong>Method</strong>
                    <p>{record.method_description}</p>
                    <strong>Abstract</strong>
                    <p>{record.abstract}</p>
                  </div>
                </details>
                <a href={record.source_url} target="_blank" rel="noreferrer" className="source-link">
                  Inspect original source <span aria-hidden="true">↗</span>
                </a>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
