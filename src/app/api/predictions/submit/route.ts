import { NextRequest, NextResponse } from "next/server";
import { getDatabaseNotConfiguredPayload, getSupabaseAdmin } from "@/lib/db/server";
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
  const admin = getSupabaseAdmin();
  if (!admin) {
    return NextResponse.json(getDatabaseNotConfiguredPayload(), { status: 503 });
  }

  let payload: PredictionPayload;
  try {
    payload = (await request.json()) as PredictionPayload;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = parsePayload(payload);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  let rateLimitHash: string;
  let userAgentHash: string;
  try {
    ({ rateLimitHash, userAgentHash } = getClientFingerprint(request));
  } catch {
    return NextResponse.json({ error: "rate_limit_salt_missing" }, { status: 500 });
  }

  const windowStart = currentWindowStart();

  const { data: allowed, error: rateLimitError } = await admin.rpc("consume_prediction_submission", {
    p_rate_limit_hash: rateLimitHash,
    p_window_start: windowStart,
    p_max_submissions: MAX_SUBMISSIONS_PER_HOUR,
  });

  if (rateLimitError) {
    return NextResponse.json({ error: "rate_limit_failed" }, { status: 500 });
  }

  if (!allowed) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const { data, error } = await admin
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
    return NextResponse.json({ error: "prediction_insert_failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, predictionId: data.id, createdAt: data.created_at }, { status: 201 });
}
