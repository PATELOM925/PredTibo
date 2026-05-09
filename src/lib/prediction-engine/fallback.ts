import { prediction, sourceLinks } from "@/lib/prediction";
import type { PublicPredictionState } from "./types";

export const fallbackPublicState: PublicPredictionState = {
  generatedAt: "2026-05-08T00:00:00.000Z",
  modelVersion: "rules-v2-fallback",
  targetIso: prediction.targetIso,
  targetDisplay: prediction.targetDisplay,
  targetUtcDisplay: prediction.targetUtcDisplay,
  headline: "PredTibo is watching public Codex reset and limit-change signals.",
  pulseQuestion: "Will Codex reset today?",
  pulseAnswer: "Quiet public signal day",
  pulseSummary:
    "PredTibo sees limited public evidence for a Codex reset or limit-change moment today, so the forecast stays conservative.",
  updatedDisplay: "Last checked May 8, 2026",
  nextUpdateDisplay: "Next scheduled update after the daily source check",
  shareText:
    "PredTibo reset weather: quiet public signal day. Fan forecast only, not official OpenAI data.",
  confidence: prediction.confidence,
  confidenceWindow: prediction.confidenceWindow,
  resetSignalProbability: 38,
  resetMeterLabel: "Quiet public reset-signal weather",
  rationale:
    "PredTibo weighs public OpenAI Codex usage, access, and plan-limit signals, then keeps the call conservative when no fresh high-confidence reset evidence is available.",
  uncertainty:
    "This meter does not know private reset schedules. It only estimates public reset or limit-change signals.",
  sourcePolicy:
    "Compliant broad discovery: official APIs where required, public official pages, approved manual entries, no login bypass.",
  evidence: [
    {
      id: "fallback-openai-codex-usage",
      title: "OpenAI public Codex usage statement",
      sourceLabel: "OpenAI",
      url: sourceLinks[0].url,
      excerpt: "OpenAI described Codex as used weekly by more than 3 million developers.",
      signalType: "codex_usage",
      confidence: 0.95,
      weight: 1.4,
      observedAt: "2026-05-08T00:00:00.000Z",
    },
    {
      id: "fallback-openai-codex-limits",
      title: "OpenAI Codex plan limits",
      sourceLabel: "OpenAI Help",
      url: sourceLinks[1].url,
      excerpt: "OpenAI Help describes Codex access and plan limits, while exact limits vary by plan and task.",
      signalType: "limit_change",
      confidence: 0.7,
      weight: 0.8,
      observedAt: "2026-05-08T00:00:00.000Z",
    },
  ],
};
