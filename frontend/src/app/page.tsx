import Link from "next/link";
import { AppHeader } from "@/components/app-header";
import { SystemStatusPanel } from "@/components/system-status";

export default function Home() {
  return (
    <div className="page-shell animate-fade-in">
      <AppHeader />
      <main>
        <section className="hero">
          <p className="eyebrow">Mine · Match · Verify</p>
          <h1>Turn science&apos;s forgotten attempts into better next steps.</h1>
          <p className="hero-copy">
            Lazarus helps researchers inspect documented failures, discover method-level
            analogies across fields, and see the confidence behind every lead.
          </p>
          <div className="hero-actions">
            <Link href="/graveyard" className="button button-primary">
              Check an approach
            </Link>
            <Link href="/necromancer" className="button button-secondary">
              Find a cross-field method
            </Link>
          </div>
          <div className="trust-strip" aria-label="Prototype principles">
            <span>Source-linked records</span>
            <span>Visible confidence</span>
            <span>Human review routing</span>
          </div>
        </section>

        <section className="module-grid" aria-labelledby="modules-title">
          <div className="section-heading">
            <p className="eyebrow">The research workflow</p>
            <h2 id="modules-title">Three modules, one confidence discipline.</h2>
          </div>
          <article className="module-card module-card-danger">
            <span className="module-index">01</span>
            <h3>The Graveyard</h3>
            <p>
              Check a planned method against a bounded collection of classified failure
              records before investing time in the same dead end.
            </p>
            <Link href="/graveyard">Search failure records <span aria-hidden="true">→</span></Link>
          </article>
          <article className="module-card module-card-accent">
            <span className="module-index">02</span>
            <h3>Citation Necromancer</h3>
            <p>
              Look for method-level similarities that can suggest useful leads outside
              the vocabulary and boundaries of your own field.
            </p>
            <Link href="/necromancer">Explore analogous methods <span aria-hidden="true">→</span></Link>
          </article>
          <article className="module-card module-card-success">
            <span className="module-index">03</span>
            <h3>Verification Exchange</h3>
            <p>
              Review uncertain classifications with the original context visible, then
              confirm or reject the system&apos;s proposed decision.
            </p>
            <Link href="/verification">Open reviewer queue <span aria-hidden="true">→</span></Link>
          </article>
        </section>

        <section className="architecture-preview" aria-labelledby="architecture-title">
          <div>
            <p className="eyebrow">Proposal-aligned architecture</p>
            <h2 id="architecture-title">A verification gate sits between retrieval and trust.</h2>
          </div>
          <ol className="flow-list">
            <li><span>1</span><div><strong>Ingest</strong><small>Normalise bounded open records</small></div></li>
            <li><span>2</span><div><strong>Model</strong><small>Classify and represent methods</small></div></li>
            <li><span>3</span><div><strong>Verify</strong><small>Route uncertainty to reviewers</small></div></li>
            <li><span>4</span><div><strong>Deliver</strong><small>Show ranked, sourced results</small></div></li>
          </ol>
        </section>

        <SystemStatusPanel />
      </main>
    </div>
  );
}
