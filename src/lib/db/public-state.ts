import { fallbackPublicState } from "@/lib/prediction-engine/fallback";
import type { PublicPredictionState, ScoringInputSignal } from "@/lib/prediction-engine/types";
import { scoreSignals } from "@/lib/prediction-engine/scoring";
import { getSupabaseAdmin } from "./server";

function formatDate(iso: string) {
  const date = new Date(iso);
  return new Intl.DateTimeFormat("en", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
    timeZoneName: "short",
  }).format(date);
}

function formatUtcDate(iso: string) {
  const date = new Date(iso);
  return new Intl.DateTimeFormat("en", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
    timeZoneName: "short",
  }).format(date);
}

function resetMeterLabel(probability: number) {
  if (probability >= 75) return "High public reset-signal activity";
  if (probability >= 45) return "Moderate public reset-signal activity";
  return "Low public reset-signal activity";
}

export async function getLatestPublicState(): Promise<PublicPredictionState> {
  const admin = getSupabaseAdmin();
  if (!admin) {
    return fallbackPublicState;
  }

  const { data: latestRun, error } = await admin
    .from("model_runs")
    .select("*")
    .eq("is_public", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`Could not load latest model run: ${error.message}`);
  }

  if (!latestRun) {
    return fallbackPublicState;
  }

  const { data: signals, error: signalError } = await admin
    .from("signals")
    .select("*")
    .in("id", latestRun.evidence_signal_ids);

  if (signalError) {
    throw new Error(`Could not load evidence signals: ${signalError.message}`);
  }

  const evidence = (signals ?? []).map((signal) => ({
    id: signal.id,
    title: signal.summary,
    sourceLabel: "Stored source",
    url: "#",
    excerpt: signal.evidence_quote ?? signal.summary,
    signalType: signal.signal_type,
    confidence: signal.confidence,
    weight: signal.weight,
  }));

  return {
    generatedAt: latestRun.created_at,
    modelVersion: latestRun.model_version,
    targetIso: latestRun.target_date,
    targetDisplay: formatDate(latestRun.target_date),
    targetUtcDisplay: formatUtcDate(latestRun.target_date),
    headline: `PredTibo calls the next Codex public-signal moment for ${formatDate(latestRun.target_date)}.`,
    confidence: latestRun.confidence_label,
    confidenceWindow: `Plus or minus ${latestRun.confidence_band_days} days`,
    resetSignalProbability: latestRun.reset_signal_probability,
    resetMeterLabel: resetMeterLabel(latestRun.reset_signal_probability),
    rationale: latestRun.rationale,
    uncertainty:
      "This is not an actual reset detector. It estimates public reset or limit-change signal probability from approved public evidence.",
    evidence,
    sourcePolicy:
      "Compliant broad discovery: official APIs where required, public official pages, approved manual entries, no login bypass.",
  };
}

export async function createAndStoreModelRun() {
  const admin = getSupabaseAdmin();
  if (!admin) {
    return null;
  }

  const { data, error } = await admin
    .from("signals")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    throw new Error(`Could not load signals for scoring: ${error.message}`);
  }

  const signals: ScoringInputSignal[] = (data ?? []).map((row) => ({
    id: row.id,
    signalType: row.signal_type,
    confidence: row.confidence,
    weight: row.weight,
    sourceTrust: 0.65,
    observedAt: row.created_at,
    summary: row.summary,
    url: "#",
    sourceLabel: "Stored source",
    excerpt: row.evidence_quote ?? row.summary,
  }));

  const scored = scoreSignals(signals);
  const { data: inserted, error: insertError } = await admin
    .from("model_runs")
    .insert({
      model_version: scored.modelVersion,
      target_date: scored.targetIso,
      confidence_label: scored.confidence,
      confidence_band_days: scored.confidenceBandDays,
      reset_signal_probability: scored.resetSignalProbability,
      rationale: scored.rationale,
      evidence_signal_ids: scored.evidence.map((item) => item.id),
      is_public: true,
    })
    .select("*")
    .single();

  if (insertError) {
    throw new Error(`Could not store model run: ${insertError.message}`);
  }

  return inserted;
}
