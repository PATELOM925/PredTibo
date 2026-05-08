import { NextRequest, NextResponse } from "next/server";
import { getDatabaseNotConfiguredPayload, getSupabaseConfigState, getSupabaseServer } from "@/lib/db/server";
import { noStoreJson } from "@/lib/http/no-store";
import { getClientFingerprint } from "@/lib/security/request";

export const runtime = "nodejs";

const MAX_SUBMISSIONS_PER_HOUR = 5;

type PredictionPayload = {
  predictedAt?: unknown;
  displayName?: unknown;
  note?: unknown;
};

function parsePayload(payload: PredictionPayload) {
  if (typeof payload.predictedAt !== "string") {
    return { ok: false as const, error: "predictedAt_required" };
  }

  const predictedAt = new Date(payload.predictedAt);
  if (Number.isNaN(predictedAt.getTime())) {
    return { ok: false as const, error: "predictedAt_invalid" };
  }

  const displayName = typeof payload.displayName === "string" ? payload.displayName.trim().slice(0, 40) : "";
  const note = typeof payload.note === "string" ? payload.note.trim().slice(0, 240) : "";

  return {
    ok: true as const,
    data: {
      predictedAt: predictedAt.toISOString(),
      displayName: displayName || null,
      note: note || null,
    },
  };
}

function currentWindowStart() {
  const now = new Date();
  now.setMinutes(0, 0, 0);
  return now.toISOString();
}

export async function POST(request: NextRequest) {
  const config = getSupabaseConfigState();
  const db = getSupabaseServer();
  if (!config.configured || !db) {
    return noStoreJson(getDatabaseNotConfiguredPayload(), { status: 503 });
  }

  let payload: PredictionPayload;
  try {
    payload = (await request.json()) as PredictionPayload;
  } catch {
    return noStoreJson({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = parsePayload(payload);
  if (!parsed.ok) {
    return noStoreJson({ error: parsed.error }, { status: 400 });
  }

  let rateLimitHash: string;
  let userAgentHash: string;
  try {
    ({ rateLimitHash, userAgentHash } = getClientFingerprint(request));
  } catch {
    return noStoreJson({ error: "rate_limit_salt_missing" }, { status: 500 });
  }

  const windowStart = currentWindowStart();

  if (config.mode === "server_rpc") {
    const { data, error } = await db.rpc("submit_user_prediction_from_server", {
      p_server_secret: config.serverActionSecret,
      p_predicted_at: parsed.data.predictedAt,
      p_display_name: parsed.data.displayName,
      p_note_private: parsed.data.note,
      p_rate_limit_hash: rateLimitHash,
      p_user_agent_hash: userAgentHash,
      p_window_start: windowStart,
      p_max_submissions: MAX_SUBMISSIONS_PER_HOUR,
    });

    if (error) {
      return noStoreJson({ error: "prediction_insert_failed" }, { status: 500 });
    }

    const result = data as { ok?: boolean; error?: string; predictionId?: string; createdAt?: string } | null;
    if (!result?.ok) {
      return noStoreJson({ error: result?.error ?? "prediction_insert_failed" }, { status: result?.error === "rate_limited" ? 429 : 500 });
    }

    return noStoreJson({ ok: true, predictionId: result.predictionId, createdAt: result.createdAt }, { status: 201 });
  }

  const { data: allowed, error: rateLimitError } = await db.rpc("consume_prediction_submission", {
    p_rate_limit_hash: rateLimitHash,
    p_window_start: windowStart,
    p_max_submissions: MAX_SUBMISSIONS_PER_HOUR,
  });

  if (rateLimitError) {
    return noStoreJson({ error: "rate_limit_failed" }, { status: 500 });
  }

  if (!allowed) {
    return noStoreJson({ error: "rate_limited" }, { status: 429 });
  }

  const { data, error } = await db
    .from("user_predictions")
    .insert({
      predicted_at: parsed.data.predictedAt,
      display_name: parsed.data.displayName,
      note_private: parsed.data.note,
      rate_limit_hash: rateLimitHash,
      user_agent_hash: userAgentHash,
      moderation_status: "private",
    })
    .select("id, created_at")
    .single();

  if (error) {
    return noStoreJson({ error: "prediction_insert_failed" }, { status: 500 });
  }

  return noStoreJson({ ok: true, predictionId: data.id, createdAt: data.created_at }, { status: 201 });
}
