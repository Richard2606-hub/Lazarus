"use client";

import { FormEvent, useState } from "react";
import { AppHeader } from "@/components/app-header";
import { PrototypeNote } from "@/components/prototype-note";
import { SavedSearches } from "@/components/saved-searches";
import { GraveyardMatch, queryGraveyard } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { X, Search, AlertCircle, CheckCircle2 } from "lucide-react";

const EXAMPLE_QUERY =
  "Using linear probing on frozen representations for external sensor classification";

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

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
    <div className="page-shell">
      <AppHeader section="The Graveyard" />
      <main className="workspace">
        <motion.section 
          initial={{ opacity: 0, y: -10 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="workspace-intro"
        >
          <div>
            <p className="eyebrow">Failure intelligence</p>
            <h1>Check before you repeat.</h1>
            <p>
              Describe the method, data, and constraint you plan to use. Lazarus returns
              related failure records with cause tags, source context, and confidence.
            </p>
          </div>
          <PrototypeNote />
        </motion.section>

        <motion.section 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
          className="query-panel" aria-labelledby="graveyard-query-title"
        >
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
            <div className="relative">
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
              {query && (
                <button
                  type="button"
                  onClick={() => { setQuery(""); setSearched(false); setResults([]); }}
                  className="absolute top-4 right-4 text-[#75877f] hover:text-white transition-colors"
                  aria-label="Clear input"
                >
                  <X size={20} />
                </button>
              )}
            </div>
            <div className="form-footer">
              <span>{query.length} / 2,000 characters</span>
              <button type="submit" className="button button-primary" disabled={loading}>
                {loading ? "Searching corpus…" : <><Search size={18} className="mr-2" /> Search failure records</>}
              </button>
            </div>
          </form>
          <AnimatePresence>
            {error && (
              <motion.p 
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                className="form-error" role="alert" aria-live="polite"
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>
          <SavedSearches
            storageKey="lazarus:graveyard-searches"
            currentQuery={query}
            onSelect={setQuery}
          />
        </motion.section>

        <section className="results-section" aria-live="polite" aria-busy={loading}>
          <AnimatePresence mode="wait">
            {searched && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="results-heading">
                <div>
                  <span className="step-label">Step 2 of 2</span>
                  <h2>{results.length} related failure {results.length === 1 ? "record" : "records"}</h2>
                </div>
                <p>Ranked by prototype query relevance</p>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {searched && results.length === 0 && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="empty-state">
                <AlertCircle size={48} className="mx-auto mb-4 text-[#75877f] opacity-50" />
                <strong>No related record was found in this bounded corpus.</strong>
                <p>Try adding the method, data type, failure mode, or key constraint.</p>
              </motion.div>
            )}
          </AnimatePresence>

          {results.length > 0 && (
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="result-list"
            >
              {results.map(({ record, match_confidence }) => (
                <motion.article variants={itemVariants} key={record.id} className="result-card result-card-danger">
                  <div className="result-card-topline">
                    <span className="source-type">{record.source_type.replaceAll("_", " ")}</span>
                    <span className={record.system_verified ? "confidence verified" : "confidence pending flex items-center"}>
                      {record.system_verified ? <CheckCircle2 size={14} className="mr-1" /> : <AlertCircle size={14} className="mr-1" />}
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
                </motion.article>
              ))}
            </motion.div>
          )}
        </section>
      </main>
    </div>
  );
}
