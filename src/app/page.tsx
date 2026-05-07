import { Activity, CalendarClock, Database, RadioTower, ShieldCheck, Sparkles, Zap } from "lucide-react";
import { Countdown } from "@/components/Countdown";
import { GuessPanel } from "@/components/GuessPanel";
import { getLatestPublicState } from "@/lib/db/public-state";
import { getSupabaseConfigState } from "@/lib/db/server";
import { sourceLinks, watchEvents } from "@/lib/prediction";

export const revalidate = 300;

export default async function Home() {
  const publicState = await getLatestPublicState();
  const serverSubmissionsEnabled = getSupabaseConfigState().configured;

  return (
    <main>
      <section className="hero-band">
        <div className="page-shell hero-grid">
          <div className="hero-copy">
            <p className="eyebrow">
              <Sparkles aria-hidden="true" size={16} />
              Fan prediction, not official OpenAI data
            </p>
            <h1>PredTibo</h1>
            <p className="lead">{publicState.headline}</p>
            <div className="hero-actions" aria-label="Prediction summary">
              <span>
                <CalendarClock aria-hidden="true" size={18} />
                {publicState.targetDisplay}
              </span>
              <span>
                <Activity aria-hidden="true" size={18} />
                {publicState.confidence} confidence
              </span>
            </div>
          </div>

          <aside className="prediction-panel" aria-label="Current prediction">
            <p className="panel-kicker">Next visible Codex adoption moment</p>
            <strong>{publicState.targetDisplay}</strong>
            <span>{publicState.targetUtcDisplay}</span>
            <Countdown targetIso={publicState.targetIso} />
            <noscript>
              <p className="noscript-note">Countdown needs JavaScript, but the prediction is still visible above.</p>
            </noscript>
          </aside>
        </div>
      </section>

      <section className="page-shell section-grid" aria-label="Prediction basis">
        <article className="info-block">
          <div className="section-title">
            <ShieldCheck aria-hidden="true" size={22} />
            <h2>Rules of the guess</h2>
          </div>
          <p>{publicState.rationale}</p>
          <p className="muted">{publicState.uncertainty}</p>
        </article>

        <article className="info-block">
          <div className="section-title">
            <Zap aria-hidden="true" size={22} />
            <h2>Scale posture</h2>
          </div>
          <p>
            Public reads stay cacheable while user guesses and source ingestion run through focused server routes.
            Database-backed features stay out of the page-rendering hot path.
          </p>
          <div className="scale-list">
            <span>
              <RadioTower aria-hidden="true" size={17} />
              CDN-first reads
            </span>
            <span>
              <Database aria-hidden="true" size={17} />
              Supabase-backed writes
            </span>
          </div>
        </article>
      </section>

      <section className="page-shell meter-section" aria-label="Tibo Reset Meter">
        <article className="meter-panel">
          <div>
            <p className="panel-kicker">Tibo Reset Meter</p>
            <h2>{publicState.resetSignalProbability}%</h2>
            <p>{publicState.resetMeterLabel}</p>
          </div>
          <div className="meter-track" aria-hidden="true">
            <span style={{ width: `${publicState.resetSignalProbability}%` }} />
          </div>
          <p className="muted">
            The meter estimates public reset or limit-change signal activity. It does not know your account&apos;s actual
            Codex reset state.
          </p>
        </article>

        <article className="evidence-panel">
          <h2>Top evidence</h2>
          <ul>
            {publicState.evidence.map((item) => (
              <li key={item.id}>
                <a href={item.url} rel="noreferrer" target={item.url === "#" ? undefined : "_blank"}>
                  {item.title}
                </a>
                <span>{item.signalType.replaceAll("_", " ")} signal</span>
              </li>
            ))}
          </ul>
        </article>
      </section>

      <section className="page-shell">
        <div className="section-title wide-title">
          <RadioTower aria-hidden="true" size={22} />
          <h2>Signals to watch</h2>
        </div>
        <div className="watch-grid">
          {watchEvents.map((event) => (
            <article className="watch-card" key={event.title}>
              <div>
                <span className={`status ${event.impact}`}>{event.impact} impact</span>
                <span className="status neutral">{event.status}</span>
              </div>
              <h3>{event.title}</h3>
              <p>{event.signal}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="page-shell split-section">
        <GuessPanel targetIso={publicState.targetIso} serverSubmissionsEnabled={serverSubmissionsEnabled} />

        <article className="sources-block">
          <h2>Source trail</h2>
          <p>
            Generated by {publicState.modelVersion}. The estimate should move when primary sources move.
          </p>
          <ul>
            {sourceLinks.map((source) => (
              <li key={source.url}>
                <a href={source.url} rel="noreferrer" target="_blank">
                  {source.label}
                </a>
              </li>
            ))}
          </ul>
        </article>
      </section>
    </main>
  );
}
