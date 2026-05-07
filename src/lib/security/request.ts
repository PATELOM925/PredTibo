import { createHash } from "node:crypto";
import type { NextRequest } from "next/server";

export function getClientFingerprint(request: NextRequest) {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = forwardedFor || request.headers.get("x-real-ip") || "unknown-ip";
  const userAgent = request.headers.get("user-agent") || "unknown-agent";
  const salt = process.env.RATE_LIMIT_SALT ?? process.env.CRON_SECRET ?? "predtibo-dev-rate-limit-salt";

  return {
    rateLimitHash: createHash("sha256").update(`${salt}:ip:${ip}`).digest("hex"),
    userAgentHash: createHash("sha256").update(`${salt}:ua:${userAgent}`).digest("hex"),
  };
}

export function isAuthorizedCronRequest(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return false;
  }

  return request.headers.get("authorization") === `Bearer ${secret}`;
}
