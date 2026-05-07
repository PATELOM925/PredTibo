import { NextRequest, NextResponse } from "next/server";
import { createAndStoreModelRun } from "@/lib/db/public-state";
import { getDatabaseNotConfiguredPayload, getSupabaseAdmin } from "@/lib/db/server";
import { isAuthorizedCronRequest } from "@/lib/security/request";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function GET(request: NextRequest) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  if (!getSupabaseAdmin()) {
    return NextResponse.json(getDatabaseNotConfiguredPayload(), { status: 503 });
  }

  const modelRun = await createAndStoreModelRun();
  return NextResponse.json({ ok: true, modelRun });
}
