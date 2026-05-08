import { createHash, timingSafeEqual } from "node:crypto";
import type { NextRequest } from "next/server";

function getRateLimitSalt() {
  const salt = process.env.RATE_LIMIT_SALT ?? process.env.CRON_SECRET;
  if (salt) {
    return salt;
  }

  if (process.env.NODE_ENV !== "production") {
    return "predtibo-dev-rate-limit-salt";
  }

  throw new Error("missing_rate_limit_salt");
}

export function getClientFingerprint(request: NextRequest) {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = forwardedFor || request.headers.get("x-real-ip") || "unknown-ip";
  const userAgent = request.headers.get("user-agent") || "unknown-agent";
  const salt = getRateLimitSalt();

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

  const authorization = request.headers.get("authorization");
  if (!authorization) {
    return false;
  }

  const actual = Buffer.from(authorization);
  const expected = Buffer.from(`Bearer ${secret}`);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
