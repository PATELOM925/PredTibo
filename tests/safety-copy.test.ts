import assert from "node:assert/strict";
import test from "node:test";
import { fallbackPublicState } from "../src/lib/prediction-engine/fallback";
import { scoreSignals } from "../src/lib/prediction-engine/scoring";
import type { ScoringInputSignal } from "../src/lib/prediction-engine/types";

const forbiddenClaims = [/guaranteed reset/i, /will reset/i, /\bknows private reset/i, /official reset detector/i];

function collectStrings(value: unknown): string[] {
  if (typeof value === "string") {
    return [value];
  }

  if (Array.isArray(value)) {
    return value.flatMap(collectStrings);
  }

  if (value && typeof value === "object") {
    return Object.values(value).flatMap(collectStrings);
  }

  return [];
}

function assertNoForbiddenClaims(value: unknown) {
  const text = collectStrings(value).join("\n");
  for (const claim of forbiddenClaims) {
    assert.doesNotMatch(text, claim);
  }
}

test("public fallback copy avoids guaranteed reset claims", () => {
  assertNoForbiddenClaims(fallbackPublicState);
});

test("scoring output avoids guaranteed reset claims even for strong signals", () => {
  const strongSignal: ScoringInputSignal = {
    id: "official-strong-signal",
    signalType: "official_confirmation",
    confidence: 0.99,
    weight: 1.5,
    sourceTrust: 0.99,
    observedAt: "2026-05-08T00:00:00.000Z",
    summary: "Official public reset-signal language",
    url: "https://example.com",
    sourceLabel: "Example",
    excerpt: "Public limit-change signal",
  };

  assertNoForbiddenClaims(scoreSignals([strongSignal], new Date("2026-05-08T00:00:00.000Z")));
});
