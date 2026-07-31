# Lazarus Testing Guide

## Test layers

| Layer | Coverage | Command |
|---|---|---|
| Backend API and pipeline | 19 tests: validation, ranking, weak-overlap rejection, status, taxonomy, routing, review decisions/history, ingestion shape, classifier, deterministic embedding | `cd backend; .\venv\Scripts\python.exe -m pytest -q` |
| Frontend components | 4 tests: home coverage, short-query validation, result/context display, rationale-gated review | `cd frontend; npm test` |
| Browser journeys | 6 tests: three critical flows on desktop Chrome and mobile Chrome | `cd frontend; npm run test:e2e` |
| Static quality | ESLint, TypeScript, Next.js production compilation and prerendering | `cd frontend; npm run lint; npm run build` |

The browser suite mocks only the HTTP responses so it can test frontend behavior deterministically. Backend behavior is tested independently against a fresh in-memory database for every test. This separation prevents a reviewer decision in one test from corrupting another test's state.

## Critical journeys

1. Researcher reads the bounded-corpus disclosure, opens Graveyard, submits an example, sees ranked confidence, expands context, and can inspect provenance.
2. Researcher submits a Necromancer problem and sees an explicitly pending cross-domain lead plus a plain-language explanation.
3. Reviewer opens the queue, cannot act without a rationale, records a decision, sees the queue update, and sees the audit history entry.

## Manual UX checklist

- Keyboard focus is visible on links, buttons, and text areas.
- Each route has a unique title and `h1`.
- Loading, empty, offline, validation, success, and pending states are understandable without color alone.
- At 412 px width, navigation wraps, forms and actions use the available width, and history rows become a single column.
- Reduced-motion preference suppresses non-essential animation.
- External source links open separately and include `rel="noreferrer"`.

## Current test notes

- The installed dependency tree reports audit findings; do not run an automatic force-fix because it may introduce breaking upgrades. Review and upgrade intentionally before production deployment.
- The FastAPI test client currently emits an upstream Starlette deprecation warning about the `httpx` compatibility layer.
- Model initialization makes the first backend pipeline test run slower than subsequent application-only calls.
