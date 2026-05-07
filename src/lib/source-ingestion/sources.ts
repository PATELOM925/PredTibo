import type { SeedSource } from "./types";

export const seedSources: SeedSource[] = [
  {
    platform: "openai",
    name: "OpenAI Codex blog",
    handle: null,
    url: "https://openai.com/index/codex-for-almost-everything/",
    trust_weight: 0.98,
    crawl_policy: "official_or_allowed",
    requires_api: false,
    is_active: true,
  },
  {
    platform: "openai",
    name: "OpenAI Codex Help",
    handle: null,
    url: "https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan",
    trust_weight: 0.95,
    crawl_policy: "official_or_allowed",
    requires_api: false,
    is_active: true,
  },
  {
    platform: "x",
    name: "Tibor public X posts",
    handle: "btibor91",
    url: "https://x.com/btibor91",
    trust_weight: 0.72,
    crawl_policy: "api_required",
    requires_api: true,
    is_active: true,
  },
  {
    platform: "x",
    name: "Sam Altman public X posts",
    handle: "sama",
    url: "https://x.com/sama",
    trust_weight: 0.82,
    crawl_policy: "api_required",
    requires_api: true,
    is_active: true,
  },
  {
    platform: "linkedin",
    name: "LinkedIn approved manual entries",
    handle: null,
    url: "https://www.linkedin.com/",
    trust_weight: 0.6,
    crawl_policy: "manual_only",
    requires_api: true,
    is_active: false,
  },
];

export function isRestrictedPlatform(platform: SeedSource["platform"]) {
  return platform === "x" || platform === "linkedin";
}
