import { NextRequest, NextResponse } from "next/server";
import { getDatabaseNotConfiguredPayload, getSupabaseAdmin } from "@/lib/db/server";
import { isAuthorizedCronRequest } from "@/lib/security/request";
import { ingestConfiguredSources } from "@/lib/source-ingestion/ingest";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const admin = getSupabaseAdmin();
  if (!admin) {
    return NextResponse.json(getDatabaseNotConfiguredPayload(), { status: 503 });
  }

  const summary = await ingestConfiguredSources(admin);
  return NextResponse.json({ ok: true, summary });
}
