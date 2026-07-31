import Link from "next/link";
import { AppHeader } from "@/components/app-header";
import { SystemStatusPanel } from "@/components/system-status";
import * as motion from "framer-motion/client";
import { Search, Compass, CheckSquare, ShieldCheck, Database, GitBranch, ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <div className="page-shell">
      <AppHeader />
      <main>
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="hero"
        >
          <p className="eyebrow inline-flex items-center">
            <span className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse"></span>
            Mine · Match · Verify
          </p>
          <h1>Turn science&apos;s forgotten attempts into better next steps.</h1>
          <p className="hero-copy">
            Lazarus helps researchers inspect documented failures, discover method-level
            analogies across fields, and see the confidence behind every lead.
          </p>
          <div className="hero-actions">
            <Link href="/graveyard" className="button button-primary group">
              <Search size={18} className="mr-2 group-hover:scale-110 transition-transform" /> Check an approach
            </Link>
            <Link href="/necromancer" className="button button-secondary group">
              <Compass size={18} className="mr-2 group-hover:rotate-45 transition-transform" /> Find a cross-field method
            </Link>
          </div>
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="trust-strip" aria-label="Prototype principles"
          >
            <span className="flex items-center"><Database size={14} className="mr-2 text-[#75877f]" /> Source-linked records</span>
            <span className="flex items-center"><ShieldCheck size={14} className="mr-2 text-[#75877f]" /> Visible confidence</span>
            <span className="flex items-center"><CheckSquare size={14} className="mr-2 text-[#75877f]" /> Human review routing</span>
          </motion.div>
        </motion.section>

        <section className="module-grid" aria-labelledby="modules-title">
          <motion.div 
            initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
            className="section-heading"
          >
            <p className="eyebrow">The research workflow</p>
            <h2 id="modules-title">Three modules, one confidence discipline.</h2>
          </motion.div>
          <motion.article 
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}
            className="module-card module-card-danger group relative overflow-hidden"
          >
            <span className="module-index">01</span>
            <h3>The Graveyard</h3>
            <p>
              Check a planned method against a bounded collection of classified failure
              records before investing time in the same dead end.
            </p>
            <Link href="/graveyard" className="inline-flex items-center">
              Search failure records <ArrowRight size={16} className="ml-1 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.article>
          <motion.article 
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }}
            className="module-card module-card-accent group relative overflow-hidden"
          >
            <span className="module-index">02</span>
            <h3>Citation Necromancer</h3>
            <p>
              Look for method-level similarities that can suggest useful leads outside
              the vocabulary and boundaries of your own field.
            </p>
            <Link href="/necromancer" className="inline-flex items-center">
              Explore analogous methods <ArrowRight size={16} className="ml-1 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.article>
          <motion.article 
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.3 }}
            className="module-card module-card-success group relative overflow-hidden"
          >
            <span className="module-index">03</span>
            <h3>Verification Exchange</h3>
            <p>
              Review uncertain classifications with the original context visible, then
              confirm or reject the system&apos;s proposed decision.
            </p>
            <Link href="/verification" className="inline-flex items-center">
              Open reviewer queue <ArrowRight size={16} className="ml-1 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.article>
        </section>

        <motion.section 
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}
          className="architecture-preview" aria-labelledby="architecture-title"
        >
          <div>
            <p className="eyebrow flex items-center"><GitBranch size={14} className="mr-2" /> Proposal-aligned architecture</p>
            <h2 id="architecture-title">A verification gate sits between retrieval and trust.</h2>
          </div>
          <ol className="flow-list">
            <li><span>1</span><div><strong>Ingest</strong><small>Normalise bounded open records</small></div></li>
            <li><span>2</span><div><strong>Model</strong><small>Classify and represent methods</small></div></li>
            <li><span>3</span><div><strong>Verify</strong><small>Route uncertainty to reviewers</small></div></li>
            <li><span>4</span><div><strong>Deliver</strong><small>Show ranked, sourced results</small></div></li>
          </ol>
        </motion.section>

        <SystemStatusPanel />
      </main>
    </div>
  );
}
