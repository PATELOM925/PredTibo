import { prediction, sourceLinks } from "@/lib/prediction";
import type { PublicPredictionState } from "./types";

export const fallbackPublicState: PublicPredictionState = {
  generatedAt: "2026-05-08T00:00:00.000Z",
  modelVersion: "rules-v2-fallback",
  targetIso: prediction.targetIso,
  targetDisplay: prediction.targetDisplay,
  targetUtcDisplay: prediction.targetUtcDisplay,
  headline: prediction.headline,
  confidence: prediction.confidence,
  confidenceWindow: prediction.confidenceWindow,
  resetSignalProbability: 38,
  resetMeterLabel: "Moderate public-signal activity",
  rationale:
    "Fallback estimate uses known public OpenAI Codex access and usage signals until Supabase-backed ingestion is configured.",
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
    },
  ],
};
