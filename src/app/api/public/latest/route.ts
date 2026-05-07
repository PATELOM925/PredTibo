import { NextResponse } from "next/server";
import { getLatestPublicState } from "@/lib/db/public-state";

export const revalidate = 300;

export async function GET() {
  const state = await getLatestPublicState();
  return NextResponse.json(state, {
    headers: {
      "Cache-Control": "public, max-age=60",
      "CDN-Cache-Control": "public, max-age=300",
      "Vercel-CDN-Cache-Control": "public, max-age=300, stale-while-revalidate=3600",
    },
  });
}
