import { NextRequest, NextResponse } from "next/server";
import { getDatabaseNotConfiguredPayload, getSupabaseAdmin } from "@/lib/db/server";
import type { PredictionSubmissionWindowRow } from "@/lib/db/types";
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

  const parsed = parsePayload((await request.json()) as PredictionPayload);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const { rateLimitHash, userAgentHash } = getClientFingerprint(request);
  const windowStart = currentWindowStart();

  const { data: existingWindowData, error: readWindowError } = await admin
    .from("prediction_submission_windows")
    .select("*")
    .eq("rate_limit_hash", rateLimitHash)
    .maybeSingle();

  if (readWindowError) {
    return NextResponse.json({ error: "rate_limit_read_failed" }, { status: 500 });
  }

  const existingWindow = existingWindowData as unknown as PredictionSubmissionWindowRow | null;
  const existingCount = existingWindow?.window_start === windowStart ? existingWindow.submission_count : 0;
  if (existingCount >= MAX_SUBMISSIONS_PER_HOUR) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const { error: writeWindowError } = await admin.from("prediction_submission_windows").upsert({
    rate_limit_hash: rateLimitHash,
    window_start: windowStart,
    submission_count: existingCount + 1,
    updated_at: new Date().toISOString(),
  });

  if (writeWindowError) {
    return NextResponse.json({ error: "rate_limit_write_failed" }, { status: 500 });
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
