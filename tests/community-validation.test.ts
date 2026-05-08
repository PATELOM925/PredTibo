import assert from "node:assert/strict";
import test from "node:test";
import { parseCommunityMessagePayload } from "../src/lib/community/validation";

test("community message validation trims and accepts short text", () => {
  const parsed = parseCommunityMessagePayload({
    displayName: "  Tibo Watcher  ",
    body: "  Medium signal day.   Watching official posts. ",
  });

  assert.equal(parsed.ok, true);
  if (parsed.ok) {
    assert.equal(parsed.data.displayName, "Tibo Watcher");
    assert.equal(parsed.data.body, "Medium signal day. Watching official posts.");
  }
});

test("community message validation blocks links", () => {
  const parsed = parseCommunityMessagePayload({
    body: "look at https://example.com",
  });

  assert.deepEqual(parsed, { ok: false, error: "links_not_allowed" });
});
