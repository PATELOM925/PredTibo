import assert from "node:assert/strict";
import test from "node:test";
import type { SourceRow } from "../src/lib/db/types";
import { extractSignalsFromText, hashContent } from "../src/lib/source-ingestion/extract";
import { isRestrictedPlatform } from "../src/lib/source-ingestion/sources";

const baseSource: SourceRow = {
  id: "source-1",
  platform: "openai",
  name: "OpenAI test source",
  handle: null,
  url: "https://openai.com/example",
  trust_weight: 0.95,
  crawl_policy: "official_or_allowed",
  requires_api: false,
  is_active: true,
  last_fetch_status: null,
  last_fetched_at: null,
  created_at: "2026-05-08T00:00:00.000Z",
  updated_at: "2026-05-08T00:00:00.000Z",
};

test("extracts official codex and limit signals from public text", () => {
  const item = extractSignalsFromText(
    baseSource,
    "OpenAI announced a Codex launch and updated ChatGPT plan limits for developers using Codex.",
  );

  assert.equal(item.fetch_status, "fetched");
  assert.ok(item.signals.some((signal) => signal.signal_type === "codex_launch"));
  assert.ok(item.signals.some((signal) => signal.signal_type === "limit_change"));
});

test("restricted platforms are separated from public page crawling", () => {
  assert.equal(isRestrictedPlatform("x"), true);
  assert.equal(isRestrictedPlatform("linkedin"), true);
  assert.equal(isRestrictedPlatform("openai"), false);
});

test("content hashing is deterministic for dedupe", () => {
  assert.equal(hashContent("same text"), hashContent("same text"));
  assert.notEqual(hashContent("same text"), hashContent("different text"));
});
