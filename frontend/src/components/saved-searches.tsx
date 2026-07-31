"use client";

import { useState } from "react";

type SavedSearchesProps = {
  storageKey: string;
  currentQuery: string;
  onSelect: (query: string) => void;
};

const MAX_SEARCHES = 5;

export function SavedSearches({
  storageKey,
  currentQuery,
  onSelect,
}: SavedSearchesProps) {
  const [searches, setSearches] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const stored = window.localStorage.getItem(storageKey);
      return stored ? (JSON.parse(stored) as string[]) : [];
    } catch {
      // Private browsing or a malformed prior value should not block search.
      return [];
    }
  });

  function persist(next: string[]) {
    setSearches(next);
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(next));
    } catch {
      // Search remains fully functional if local storage is unavailable.
    }
  }

  function saveCurrent() {
    const normalized = currentQuery.trim();
    if (normalized.length < 12) return;
    persist([normalized, ...searches.filter((item) => item !== normalized)].slice(0, MAX_SEARCHES));
  }

  if (searches.length === 0) {
    return (
      <div className="saved-searches saved-searches-empty">
        <span>No searches saved on this device.</span>
        <button type="button" className="text-button" onClick={saveCurrent} disabled={currentQuery.trim().length < 12}>
          Save this query
        </button>
      </div>
    );
  }

  return (
    <div className="saved-searches">
      <div className="saved-searches-heading">
        <strong>Saved on this device</strong>
        <button type="button" className="text-button" onClick={saveCurrent} disabled={currentQuery.trim().length < 12}>
          Save current
        </button>
      </div>
      <div className="saved-search-list">
        {searches.map((search) => (
          <div key={search}>
            <button type="button" onClick={() => onSelect(search)} title={search}>
              {search}
            </button>
            <button
              type="button"
              className="saved-search-remove"
              aria-label={`Remove saved search: ${search}`}
              onClick={() => persist(searches.filter((item) => item !== search))}
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
