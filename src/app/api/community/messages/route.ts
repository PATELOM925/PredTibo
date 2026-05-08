import { NextRequest, NextResponse } from "next/server";
import { parseCommunityMessagePayload, type CommunityMessagePayload } from "@/lib/community/validation";
import { getApprovedCommunityMessages } from "@/lib/db/community";
import { getDatabaseNotConfiguredPayload, getSupabaseConfigState, getSupabaseServer } from "@/lib/db/server";
import { noStoreJson } from "@/lib/http/no-store";
import { getClientFingerprint } from "@/lib/security/request";

export const runtime = "nodejs";

const MAX_MESSAGES_PER_HOUR = 8;

function currentWindowStart() {
  const now = new Date();
  now.setMinutes(0, 0, 0);
  return now.toISOString();
}

export async function GET() {
  const messages = await getApprovedCommunityMessages(12);

  return NextResponse.json(
    { ok: true, messages },
    {
      headers: {
        "Cache-Control": "public, max-age=15, stale-while-revalidate=45",
        "CDN-Cache-Control": "public, max-age=30",
        "Vercel-CDN-Cache-Control": "public, max-age=30",
      },
    },
  );
}

export async function POST(request: NextRequest) {
  const config = getSupabaseConfigState();
  const db = getSupabaseServer();
  if (!config.configured || !db) {
    return noStoreJson(getDatabaseNotConfiguredPayload(), { status: 503 });
  }

  let payload: CommunityMessagePayload;
  try {
    payload = (await request.json()) as CommunityMessagePayload;
  } catch {
    return noStoreJson({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = parseCommunityMessagePayload(payload);
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

  if (config.mode !== "server_rpc") {
    const { data: allowed, error: rateLimitError } = await db.rpc("consume_rate_limit_action", {
      p_rate_limit_key: `community_message:${rateLimitHash}`,
      p_window_start: currentWindowStart(),
      p_max_actions: MAX_MESSAGES_PER_HOUR,
    });

    if (rateLimitError) {
      return noStoreJson({ error: "rate_limit_failed" }, { status: 500 });
    }

    if (!allowed) {
      return noStoreJson({ error: "rate_limited" }, { status: 429 });
    }

    const { data, error } = await db
      .from("community_messages")
      .insert({
        display_name: parsed.data.displayName,
        body: parsed.data.body,
        rate_limit_hash: rateLimitHash,
        user_agent_hash: userAgentHash,
        moderation_status: "pending",
      })
      .select("id, created_at, moderation_status")
      .single();

    if (error) {
      return noStoreJson({ error: "message_insert_failed" }, { status: 500 });
    }

    return noStoreJson(
      { ok: true, messageId: data.id, createdAt: data.created_at, moderationStatus: data.moderation_status },
      { status: 201 },
    );
  }

  const { data, error } = await db.rpc("submit_community_message_from_server", {
    p_server_secret: config.serverActionSecret,
    p_display_name: parsed.data.displayName,
    p_body: parsed.data.body,
    p_rate_limit_hash: rateLimitHash,
    p_user_agent_hash: userAgentHash,
    p_window_start: currentWindowStart(),
    p_max_messages: MAX_MESSAGES_PER_HOUR,
  });

  if (error) {
    return noStoreJson({ error: "message_insert_failed" }, { status: 500 });
  }

  const result = data as
    | { ok?: boolean; error?: string; messageId?: string; createdAt?: string; moderationStatus?: string }
    | null;

  if (!result?.ok) {
    return noStoreJson({ error: result?.error ?? "message_insert_failed" }, { status: result?.error === "rate_limited" ? 429 : 500 });
  }

  return noStoreJson(
    {
      ok: true,
      messageId: result.messageId,
      createdAt: result.createdAt,
      moderationStatus: result.moderationStatus,
    },
    { status: 201 },
  );
}
