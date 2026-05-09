import type { CSSProperties } from "react";
import Link from "next/link";
import { CalendarClock, ExternalLink, RadioTower, Share2, ShieldCheck, Sparkles, Target } from "lucide-react";
import { CommunityCenter } from "@/components/CommunityCenter";
import { Countdown } from "@/components/Countdown";
import { GuessPanel } from "@/components/GuessPanel";
import { ThemeToggle } from "@/components/ThemeToggle";
import { getApprovedCommunityMessages } from "@/lib/db/community";
import { getLatestPublicState } from "@/lib/db/public-state";
import { getSupabaseConfigState } from "@/lib/db/server";
import { sourceLinks, watchEvents } from "@/lib/prediction";

export const revalidate = 300;

export default async function Home() {
  const publicState = await getLatestPublicState();
  const serverSubmissionsEnabled = getSupabaseConfigState().configured;
  const communityMessages = await getApprovedCommunityMessages();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://predtibo.vercel.app";
  const shareHref = `https://twitter.com/intent/tweet?text=${encodeURIComponent(publicState.shareText)}&url=${encodeURIComponent(siteUrl)}`;
  const topEvidence = publicState.evidence.slice(0, 3);

  return (
    <main>
      <section className="hero-band">
        <div className="page-shell topbar">
          <Link className="brand-lockup" href="/" aria-label="PredTibo home">
            <span className="brand-mark">PT</span>
            <span>PredTibo</span>
          </Link>
          <nav className="topnav" aria-label="Primary navigation">
            <a href="#evidence">Receipts</a>
            <a href="#make-your-call">Predict</a>
            <a href="#community">Community</a>
          </nav>
          <ThemeToggle />
        </div>
        <div className="page-shell hero-grid">
          <div className="hero-copy">
            <p className="eyebrow">
              <Sparkles aria-hidden="true" size={16} />
              Daily public-signal forecast
            </p>
            <h1>{publicState.pulseQuestion}</h1>
            <p className="lead">
              {publicState.pulseSummary} Fan project, not official OpenAI data.
            </p>
            <div className="hero-actions" aria-label="Launch actions">
              <a className="action-button primary-action" href="#make-your-call">
                <Target aria-hidden="true" size={18} />
                Make your call
              </a>
              <a className="action-button secondary-action" href={shareHref} rel="noreferrer" target="_blank">
                <Share2 aria-hidden="true" size={18} />
                Share today&apos;s card
              </a>
            </div>
          </div>

          <aside className="weather-panel" aria-label="Today's Codex reset weather">
            <div className="weather-topline">
              <p className="panel-kicker">Reset weather</p>
              <span>{publicState.updatedDisplay}</span>
            </div>
            <div
              aria-label={`${publicState.resetSignalProbability}% ${publicState.resetMeterLabel}`}
              className="weather-dial"
              style={{ "--score": `${publicState.resetSignalProbability}%` } as CSSProperties}
            >
              <span>{publicState.resetSignalProbability}%</span>
            </div>
            <strong>{publicState.pulseAnswer}</strong>
            <p>{publicState.resetMeterLabel}</p>
            <div className="receipt-strip" aria-label="Top receipts">
              {topEvidence.map((item) => (
                <a href={item.url} key={item.id} rel="noreferrer" target="_blank">
                  <ExternalLink aria-hidden="true" size={14} />
                  {item.sourceLabel}
                </a>
              ))}
            </div>
          </aside>
        </div>
      </section>

      <section className="page-shell launch-summary" aria-label="Prediction summary">
        <article className="summary-card">
          <span>Next Codex milestone read</span>
          <strong>{publicState.targetDisplay}</strong>
          <p>{publicState.targetUtcDisplay}</p>
        </article>
        <article className="summary-card">
          <span>Confidence band</span>
          <strong>{publicState.confidence}</strong>
          <p>{publicState.confidenceWindow}</p>
        </article>
        <article className="summary-card">
          <span>Next refresh</span>
          <strong>Daily check</strong>
          <p>{publicState.nextUpdateDisplay}</p>
        </article>
      </section>

      <section className="page-shell focus-grid" aria-label="Countdown and rules">
        <article className="countdown-panel">
          <div className="section-title">
            <CalendarClock aria-hidden="true" size={22} />
            <h2>Countdown to the current call</h2>
          </div>
            <Countdown targetIso={publicState.targetIso} />
            <noscript>
              <p className="noscript-note">Countdown needs JavaScript, but the prediction is still visible above.</p>
            </noscript>
        </article>
        <article className="method-panel">
          <div className="section-title">
            <ShieldCheck aria-hidden="true" size={22} />
            <h2>How PredTibo stays honest</h2>
          </div>
          <p>{publicState.rationale}</p>
          <p className="muted">{publicState.uncertainty}</p>
        </article>
      </section>

      <section className="page-shell meter-section" aria-label="Tibo Reset Meter" id="evidence">
        <article className="meter-panel">
          <div className="meter-header">
            <p className="panel-kicker">Tibo Reset Meter</p>
            <div
              aria-label={`${publicState.resetSignalProbability}% ${publicState.resetMeterLabel}`}
              className="meter-dial"
              style={{ "--score": `${publicState.resetSignalProbability}%` } as CSSProperties}
            >
              <span>{publicState.resetSignalProbability}%</span>
            </div>
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
          <h2>Receipts behind today&apos;s read</h2>
          <ul>
            {publicState.evidence.map((item) => (
              <li key={item.id}>
                <a href={item.url} rel="noreferrer" target="_blank">
                  {item.title}
                  <ExternalLink aria-hidden="true" size={15} />
                </a>
                <span>
                  {item.sourceLabel} · {item.signalType.replaceAll("_", " ")} · observed{" "}
                  {new Date(item.observedAt).toLocaleDateString("en", { month: "short", day: "numeric" })}
                </span>
              </li>
            ))}
          </ul>
        </article>
      </section>

      <section className="page-shell">
        <div className="section-title wide-title">
          <RadioTower aria-hidden="true" size={22} />
          <h2>What could move the weather</h2>
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
          <h2>Source policy</h2>
          <p>{publicState.sourcePolicy}</p>
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

      <section className="page-shell" id="community">
        <CommunityCenter
          initialMessages={communityMessages}
          serverSubmissionsEnabled={serverSubmissionsEnabled}
        />
      </section>
    </main>
  );
}
