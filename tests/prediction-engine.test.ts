import assert from "node:assert/strict";
import test from "node:test";
import { scoreSignals } from "../src/lib/prediction-engine/scoring";
import type { ScoringInputSignal } from "../src/lib/prediction-engine/types";

const now = new Date("2026-05-08T00:00:00.000Z");

function signal(overrides: Partial<ScoringInputSignal>): ScoringInputSignal {
  return {
    id: "signal-1",
    signalType: "codex_usage",
    confidence: 0.8,
    weight: 1,
    sourceTrust: 0.8,
    observedAt: "2026-05-07T00:00:00.000Z",
    summary: "Codex public signal",
    url: "https://example.com",
    sourceLabel: "Example",
    excerpt: "Codex signal excerpt",
    ...overrides,
  };
}

test("official fresh reset signal raises reset probability with evidence", () => {
  const scored = scoreSignals(
    [
      signal({
        id: "official-reset",
        signalType: "official_confirmation",
        confidence: 0.95,
        weight: 1.3,
        sourceTrust: 0.98,
      }),
      signal({
        id: "limit-change",
        signalType: "limit_change",
        confidence: 0.85,
        weight: 1.1,
        sourceTrust: 0.95,
      }),
    ],
    now,
  );

  assert.equal(scored.modelVersion, "rules-v2.1.0");
  assert.ok(scored.resetSignalProbability >= 65);
  assert.ok(scored.evidence.some((item) => item.id === "official-reset"));
  assert.match(scored.uncertainty, /not an actual reset detector/i);
  assert.equal(scored.scoreBreakdown.evidenceCount, scored.evidence.length);
});

test("weak rumor does not create fake certainty", () => {
  const scored = scoreSignals(
    [
      signal({
        id: "weak-rumor",
        signalType: "rumor",
        confidence: 0.35,
        weight: 0.4,
        sourceTrust: 0.35,
        summary: "Maybe reset rumor",
      }),
    ],
    now,
  );

  assert.equal(scored.confidence, "Low");
  assert.ok(scored.resetSignalProbability < 45);
});

test("contradiction reduces reset probability", () => {
  const positiveOnly = scoreSignals([signal({ signalType: "limit_change", confidence: 0.8, weight: 1.1 })], now);
  const withContradiction = scoreSignals(
    [
      signal({ signalType: "limit_change", confidence: 0.8, weight: 1.1 }),
      signal({
        id: "contradiction",
        signalType: "contradiction",
        confidence: 0.9,
        weight: 1.2,
        sourceTrust: 0.9,
      }),
    ],
    now,
  );

  assert.ok(withContradiction.resetSignalProbability < positiveOnly.resetSignalProbability);
});
