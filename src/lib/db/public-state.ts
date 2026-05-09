import { fallbackPublicState } from "@/lib/prediction-engine/fallback";
import type { Evidence, PublicPredictionState, ScoringInputSignal } from "@/lib/prediction-engine/types";
import { scoreSignals } from "@/lib/prediction-engine/scoring";
import { getSupabaseConfigState, getSupabasePublicReadServer, getSupabaseServer } from "./server";

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

function formatShortDate(iso: string) {
  const date = new Date(iso);
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
    timeZoneName: "short",
  }).format(date);
}

function resetMeterLabel(probability: number) {
  if (probability >= 75) return "Hot public reset-signal weather";
  if (probability >= 45) return "Watch public reset-signal weather";
  return "Quiet public reset-signal weather";
}

function pulseAnswer(probability: number) {
  if (probability >= 75) return "Hot signal day";
  if (probability >= 45) return "Watch the wires";
  return "Quiet public signal day";
}

function nextUpdateDisplay(generatedAt: string) {
  const nextUpdate = new Date(generatedAt);
  nextUpdate.setUTCDate(nextUpdate.getUTCDate() + 1);
  nextUpdate.setUTCHours(0, 20, 0, 0);
  return `Next scheduled update ${formatShortDate(nextUpdate.toISOString())}`;
}

type SourceItemForSignal = {
  url?: string | null;
  title?: string | null;
  excerpt?: string | null;
  author_name?: string | null;
  published_at?: string | null;
  fetched_at?: string | null;
  sources?: { name?: string | null; trust_weight?: number | null; url?: string | null } | null;
};

type SignalWithSource = {
  id: string;
  source_item_id: string | null;
  signal_type: Evidence["signalType"];
  confidence: number;
  weight: number;
  summary: string;
  evidence_quote: string | null;
  created_at: string;
  source_items?: SourceItemForSignal | null;
};

function normalizeEvidence(signal: SignalWithSource): Evidence {
  const sourceItem = signal.source_items;
  const observedAt = sourceItem?.published_at ?? sourceItem?.fetched_at ?? signal.created_at;
  const sourceLabel = sourceItem?.title ?? sourceItem?.author_name ?? sourceItem?.sources?.name ?? "Public source";
  const url = sourceItem?.url ?? sourceItem?.sources?.url ?? fallbackPublicState.evidence[0].url;

  return {
    id: signal.id,
    title: signal.summary,
    sourceLabel,
    url,
    excerpt: signal.evidence_quote ?? sourceItem?.excerpt ?? signal.summary,
    signalType: signal.signal_type,
    confidence: signal.confidence,
    weight: signal.weight,
    observedAt,
  };
}

function normalizeEvidenceSnapshot(value: unknown): Evidence[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is Partial<Evidence> => Boolean(item) && typeof item === "object")
    .map((item, index) => ({
      id: String(item.id ?? `snapshot-evidence-${index}`),
      title: String(item.title ?? "Public evidence"),
      sourceLabel: String(item.sourceLabel ?? "Public source"),
      url: typeof item.url === "string" && item.url.startsWith("http") ? item.url : fallbackPublicState.evidence[0].url,
      excerpt: String(item.excerpt ?? item.title ?? "Public evidence signal"),
      signalType: item.signalType ?? "rumor",
      confidence: Number(item.confidence ?? 0.5),
      weight: Number(item.weight ?? 0.5),
      observedAt: String(item.observedAt ?? new Date().toISOString()),
    }));
}

function normalizePublicStateSnapshot(value: unknown): PublicPredictionState | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const state = value as Partial<PublicPredictionState>;
  if (
    typeof state.generatedAt !== "string" ||
    typeof state.targetIso !== "string" ||
    typeof state.pulseQuestion !== "string" ||
    typeof state.pulseAnswer !== "string" ||
    typeof state.resetSignalProbability !== "number" ||
    !Array.isArray(state.evidence)
  ) {
    return null;
  }

  return {
    ...fallbackPublicState,
    ...state,
    evidence: normalizeEvidenceSnapshot(state.evidence),
  };
}

async function getLatestPublicSnapshot() {
  const db = getSupabasePublicReadServer();
  if (!db) {
    return null;
  }

  const { data, error } = await db
    .from("prediction_snapshots")
    .select("payload")
    .eq("is_public", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error(`Could not load public prediction snapshot: ${error.message}`);
    return null;
  }

  return normalizePublicStateSnapshot(data?.payload);
}

function buildPublicState(latestRun: {
  id?: string;
  created_at: string;
  model_version: string;
  target_date: string;
  confidence_label: "Low" | "Medium" | "High";
  confidence_band_days: number;
  reset_signal_probability: number;
  rationale: string;
}, evidence: Evidence[]): PublicPredictionState {
  const resetLabel = resetMeterLabel(latestRun.reset_signal_probability);
  const answer = pulseAnswer(latestRun.reset_signal_probability);
  const targetDisplay = formatDate(latestRun.target_date);

  return {
    generatedAt: latestRun.created_at,
    modelVersion: latestRun.model_version,
    targetIso: latestRun.target_date,
    targetDisplay,
    targetUtcDisplay: formatUtcDate(latestRun.target_date),
    headline: `PredTibo reads public Codex signals for ${answer.toLowerCase()}.`,
    pulseQuestion: "Will Codex reset today?",
    pulseAnswer: answer,
    pulseSummary: `PredTibo sees ${latestRun.reset_signal_probability}% public reset-signal activity. ${latestRun.confidence_label} confidence, with a ${latestRun.confidence_band_days}-day milestone band.`,
    updatedDisplay: `Updated ${formatShortDate(latestRun.created_at)}`,
    nextUpdateDisplay: nextUpdateDisplay(latestRun.created_at),
    shareText: `PredTibo reset weather: ${latestRun.reset_signal_probability}% ${answer}. Fan forecast only, not official OpenAI data.`,
    confidence: latestRun.confidence_label,
    confidenceWindow: `Plus or minus ${latestRun.confidence_band_days} days`,
    resetSignalProbability: latestRun.reset_signal_probability,
    resetMeterLabel: resetLabel,
    rationale: latestRun.rationale,
    uncertainty:
      "This is not an actual reset detector. It estimates public reset or limit-change signal probability from approved public evidence.",
    evidence,
    sourcePolicy:
      "Compliant broad discovery: official APIs where required, public official pages, approved manual entries, no login bypass.",
  };
}

export async function getLatestPublicState(): Promise<PublicPredictionState> {
  const db = getSupabaseServer();
  if (!db) {
    return (await getLatestPublicSnapshot()) ?? fallbackPublicState;
  }

  const { data: latestRun, error } = await db
    .from("model_runs")
    .select("*")
    .eq("is_public", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error(`Could not load latest model run: ${error.message}`);
    return (await getLatestPublicSnapshot()) ?? fallbackPublicState;
  }

  if (!latestRun) {
    return (await getLatestPublicSnapshot()) ?? fallbackPublicState;
  }

  const snapshotEvidence = normalizeEvidenceSnapshot((latestRun as { evidence_snapshot?: unknown }).evidence_snapshot);
  if (snapshotEvidence.length > 0) {
    return buildPublicState(latestRun, snapshotEvidence);
  }

  const { data: signals, error: signalError } = await db
    .from("signals")
    .select("*, source_items(url, title, excerpt, author_name, published_at, fetched_at, sources(name, trust_weight, url))")
    .in("id", latestRun.evidence_signal_ids);

  if (signalError) {
    console.error(`Could not load evidence signals: ${signalError.message}`);
    return (await getLatestPublicSnapshot()) ?? fallbackPublicState;
  }

  const evidence = ((signals ?? []) as SignalWithSource[]).map(normalizeEvidence);
  return buildPublicState(latestRun, evidence);
}

export async function createAndStoreModelRun() {
  const config = getSupabaseConfigState();
  const db = getSupabaseServer();
  if (!config.configured || !db) {
    return null;
  }

  const { data, error } = await db
    .from("signals")
    .select("*, source_items(url, title, excerpt, author_name, published_at, fetched_at, sources(name, trust_weight, url))")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    throw new Error(`Could not load signals for scoring: ${error.message}`);
  }

  const signals: ScoringInputSignal[] = ((data ?? []) as SignalWithSource[]).map((row) => {
    const sourceItem = row.source_items;
    return {
      id: row.id,
      signalType: row.signal_type,
      confidence: row.confidence,
      weight: row.weight,
      sourceTrust: sourceItem?.sources?.trust_weight ?? 0.65,
      observedAt: sourceItem?.published_at ?? sourceItem?.fetched_at ?? row.created_at,
      summary: row.summary,
      url: sourceItem?.url ?? sourceItem?.sources?.url ?? fallbackPublicState.evidence[0].url,
      sourceLabel: sourceItem?.title ?? sourceItem?.author_name ?? sourceItem?.sources?.name ?? "Public source",
      excerpt: row.evidence_quote ?? sourceItem?.excerpt ?? row.summary,
    };
  });

  const scored = scoreSignals(signals);
  const evidenceSignalIds = scored.evidence.map((item) => item.id);

  const { data: inserted, error: insertError } =
    config.mode === "server_rpc"
      ? await db.rpc("insert_model_run_from_server", {
          p_server_secret: config.serverActionSecret,
          p_model_version: scored.modelVersion,
          p_target_date: scored.targetIso,
          p_confidence_label: scored.confidence,
          p_confidence_band_days: scored.confidenceBandDays,
          p_reset_signal_probability: scored.resetSignalProbability,
          p_rationale: scored.rationale,
          p_evidence_signal_ids: evidenceSignalIds,
        })
      : await db
          .from("model_runs")
          .insert({
            model_version: scored.modelVersion,
            target_date: scored.targetIso,
            confidence_label: scored.confidence,
            confidence_band_days: scored.confidenceBandDays,
            reset_signal_probability: scored.resetSignalProbability,
            rationale: scored.rationale,
            evidence_signal_ids: evidenceSignalIds,
            evidence_snapshot: scored.evidence,
            score_breakdown: scored.scoreBreakdown,
            is_public: true,
          })
          .select("*")
          .single();

  if (insertError) {
    throw new Error(`Could not store model run: ${insertError.message}`);
  }

  if (config.mode === "service_role" && inserted && "id" in inserted) {
    const snapshot = buildPublicState(
      {
        id: inserted.id,
        created_at: inserted.created_at,
        model_version: scored.modelVersion,
        target_date: scored.targetIso,
        confidence_label: scored.confidence,
        confidence_band_days: scored.confidenceBandDays,
        reset_signal_probability: scored.resetSignalProbability,
        rationale: scored.rationale,
      },
      scored.evidence,
    );

    const { error: snapshotError } = await db.from("prediction_snapshots").upsert(
      {
        model_run_id: inserted.id,
        payload: snapshot,
        is_public: true,
      },
      { onConflict: "model_run_id" },
    );

    if (snapshotError) {
      throw new Error(`Could not store prediction snapshot: ${snapshotError.message}`);
    }
  }

  return inserted;
}
