# Proposal Feature Coverage

Status is intentionally conservative: **implemented** means working in this prototype; **prototype** means a bounded substitute exists; **planned** means the proposal promise is not yet implemented.

| # | Proposed component | Status | Evidence and remaining work |
|---:|---|---|---|
| 1 | Next.js and TypeScript web application | Implemented | Four responsive routes, route metadata, active navigation, loading/error/empty states |
| 2 | Query and results interface | Implemented | Graveyard and Necromancer forms, ranked cards, local saved searches, method context |
| 3 | Confidence indicator and explanation display | Implemented | Verified/pending badges, scores, generated-proxy explanation, source links |
| 4 | Graveyard mining and classification | Prototype | Fixed taxonomy, bounded records, lexical retrieval; live licensed adapters and Gemini classifier remain planned |
| 5 | Citation Necromancer structural matching | Prototype | Honest lexical structural proxy; contrastive model and topical-exclusion radius remain planned |
| 6 | Verification Exchange | Implemented | Threshold routing, queue, confirm/reject, rationale, conflict handling, audit history |
| 7 | Structural embedding model | Prototype | MiniLM representation and deterministic fallback; contrastive fine-tuning pipeline remains planned |
| 8 | Ingestion and normalisation | Prototype | Common normalized shape and repeatable runner; scheduled external adapters remain planned |
| 9 | Postgres and pgvector retrieval | Planned | SQLite is used locally; the model supports pgvector when installed, but production Postgres is not configured |
| 10 | Reviewer queue and verification interface | Implemented | Source context and rationale-gated decisions; reviewer authentication remains planned |
| 11 | FastAPI backend service | Implemented | Validated REST contract, OpenAPI generation, CORS configuration, typed response models |
| 12 | Gemini provider interface | Planned | Current classifier/explanation logic is a transparent local mock; provider abstraction and caching are not implemented |
| 13 | Vercel and GitHub Actions delivery | Planned | Local production build and quality commands exist; deployment configuration and CI workflow are not in this workspace |

## Scope-aligned experience requirements

- Source provenance: implemented on every result and queue item.
- Visible confidence: implemented for both researcher modules.
- Bounded coverage disclosure: implemented on module introductions, empty states, and live status.
- Human review: implemented with evidence-based rationale and history.
- Saved searches: implemented locally on the user's device; account-level paid-tier sync remains planned.
- Cross-field explanations: implemented as clearly labelled prototype scaffolding, not claimed as the final trained model.

## Priority production gaps

1. Replace lexical Necromancer ranking with the contrastively fine-tuned structural model and topical exclusion described in the proposal.
2. Replace demonstration ingestion with openly licensed adapters and persistent classification/explanation caching.
3. Migrate SQLite to Postgres + pgvector with schema migrations.
4. Add authentication, reviewer roles, tenant isolation, rate limits, and audit administration.
5. Add the Gemini provider abstraction, fallback provider, cost controls, and calibrated confidence signals.
6. Add CI/CD and deploy-time integration tests against the production database and host.
