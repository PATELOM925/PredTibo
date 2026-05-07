import type { Evidence, ScoringInputSignal, ScoringResult } from "./types";

export const SCORING_MODEL_VERSION = "rules-v2.0.0";

const RESET_POSITIVE_TYPES = new Set<ScoringInputSignal["signalType"]>([
  "limit_change",
  "free_access",
  "reset_language",
  "official_confirmation",
]);

const ADOPTION_POSITIVE_TYPES = new Set<ScoringInputSignal["signalType"]>([
  "codex_usage",
  "codex_launch",
  "official_confirmation",
]);

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function daysSince(dateIso: string, now: Date) {
  const observedAt = new Date(dateIso).getTime();
  if (Number.isNaN(observedAt)) {
    return 30;
  }

  return Math.max(0, (now.getTime() - observedAt) / 86_400_000);
}

function recencyFactor(dateIso: string, now: Date) {
  const ageDays = daysSince(dateIso, now);
  if (ageDays <= 1) return 1;
  if (ageDays <= 7) return 0.8;
  if (ageDays <= 21) return 0.55;
  return 0.32;
}

function signalScore(signal: ScoringInputSignal, now: Date) {
  const direction = signal.signalType === "contradiction" ? -1 : 1;
  const rumorPenalty = signal.signalType === "rumor" ? 0.35 : 1;
  return (
    direction *
    signal.confidence *
    signal.weight *
    signal.sourceTrust *
    recencyFactor(signal.observedAt, now) *
    rumorPenalty
  );
}

function confidenceLabel(strength: number): "Low" | "Medium" | "High" {
  if (strength >= 3.2) return "High";
  if (strength >= 1.35) return "Medium";
  return "Low";
}

function confidenceBandDays(confidence: "Low" | "Medium" | "High") {
  if (confidence === "High") return 7;
  if (confidence === "Medium") return 14;
  return 28;
}

function chooseTargetIso(now: Date, signals: ScoringInputSignal[], strength: number) {
  const hasRecentOfficialLaunch = signals.some(
    (signal) =>
      signal.signalType === "official_confirmation" &&
      signal.sourceTrust >= 0.85 &&
      daysSince(signal.observedAt, now) <= 14,
  );
  const leadDays = hasRecentOfficialLaunch ? 10 : clamp(Math.round(42 - strength * 6), 14, 56);
  const target = new Date(now);
  target.setUTCDate(target.getUTCDate() + leadDays);
  target.setUTCHours(11, 30, 0, 0);
  return target.toISOString();
}

function toEvidence(signal: ScoringInputSignal): Evidence {
  return {
    id: signal.id,
    title: signal.summary,
    sourceLabel: signal.sourceLabel,
    url: signal.url,
    excerpt: signal.excerpt,
    signalType: signal.signalType,
    confidence: signal.confidence,
    weight: signal.weight,
  };
}

export function scoreSignals(signals: ScoringInputSignal[], now = new Date()): ScoringResult {
  const scored = signals.map((signal) => ({ signal, score: signalScore(signal, now) }));
  const resetStrength = scored
    .filter(({ signal }) => RESET_POSITIVE_TYPES.has(signal.signalType) || signal.signalType === "contradiction")
    .reduce((total, item) => total + item.score, 0);
  const adoptionStrength = scored
    .filter(({ signal }) => ADOPTION_POSITIVE_TYPES.has(signal.signalType) || signal.signalType === "contradiction")
    .reduce((total, item) => total + item.score, 0);
  const overallStrength = Math.max(0, adoptionStrength + Math.max(0, resetStrength * 0.45));
  const confidence = confidenceLabel(overallStrength);
  const topEvidence = scored
    .filter(({ score }) => score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, 5)
    .map(({ signal }) => toEvidence(signal));

  const resetSignalProbability = clamp(Math.round(35 + resetStrength * 16), 5, 92);
  const targetIso = chooseTargetIso(now, signals, overallStrength);

  return {
    modelVersion: SCORING_MODEL_VERSION,
    targetIso,
    confidence,
    confidenceBandDays: confidenceBandDays(confidence),
    resetSignalProbability,
    rationale:
      topEvidence.length > 0
        ? `Rules model scored ${topEvidence.length} public evidence items; official and recent signals carry the highest weight.`
        : "Rules model found no fresh high-confidence evidence, so it keeps the fallback prediction conservative.",
    uncertainty:
      "This is not an actual reset detector. It estimates public reset or limit-change signal probability from approved public evidence.",
    evidence: topEvidence,
  };
}
