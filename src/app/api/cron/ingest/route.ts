import { NextRequest, NextResponse } from "next/server";
import { getDatabaseNotConfiguredPayload, getSupabaseConfigState, getSupabaseServer } from "@/lib/db/server";
import { noStoreJson } from "@/lib/http/no-store";
import { isAuthorizedCronRequest } from "@/lib/security/request";
import { ingestConfiguredSources } from "@/lib/source-ingestion/ingest";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  if (!isAuthorizedCronRequest(request)) {
    return noStoreJson({ error: "unauthorized" }, { status: 401 });
  }

  const config = getSupabaseConfigState();
  const db = getSupabaseServer();
  if (!config.configured || !db) {
    return noStoreJson(getDatabaseNotConfiguredPayload(), { status: 503 });
  }

  const summary = await ingestConfiguredSources(db, config);
  return noStoreJson({ ok: true, summary });
}
