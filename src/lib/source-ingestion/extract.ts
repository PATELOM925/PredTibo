import { createHash } from "node:crypto";
import type { SourceRow } from "@/lib/db/types";
import type { IngestedItem } from "./types";

type ExtractableSource = Pick<SourceRow, "platform" | "name" | "handle" | "url" | "trust_weight"> & {
  id?: string;
};

type KeywordRule = {
  pattern: RegExp;
  signalType: IngestedItem["signals"][number]["signal_type"];
  weight: number;
  confidence: number;
  needsCodexContext?: boolean;
};

const keywordRules: KeywordRule[] = [
  { pattern: /\bcodex\b[\s\S]{0,160}\b(used|users|developers|adoption)\b/i, signalType: "codex_usage", weight: 1.4, confidence: 0.82 },
  { pattern: /\bcodex\b[\s\S]{0,160}\b(launch|release|ship|available)\b/i, signalType: "codex_launch", weight: 1.0, confidence: 0.75 },
  { pattern: /\b(limit|limits|quota|usage)\b[\s\S]{0,160}\b(codex|chatgpt)\b/i, signalType: "limit_change", weight: 0.9, confidence: 0.72 },
  { pattern: /\b(free|temporary access|free access)\b[\s\S]{0,160}\bcodex\b/i, signalType: "free_access", weight: 0.85, confidence: 0.68 },
  {
    pattern: /\b(reset|resetting|refill|refilled)\b[\s\S]{0,160}\b(codex|chatgpt|limit|limits|quota|usage)\b/i,
    signalType: "reset_language",
    weight: 0.8,
    confidence: 0.55,
    needsCodexContext: true,
  },
  { pattern: /\bconfirmed|official|announced\b/i, signalType: "official_confirmation", weight: 1.1, confidence: 0.74, needsCodexContext: true },
  { pattern: /\brumor|maybe|guess|speculat/i, signalType: "rumor", weight: 0.35, confidence: 0.35, needsCodexContext: true },
  { pattern: /\bnot available|no reset|no change|unchanged\b/i, signalType: "contradiction", weight: 1.1, confidence: 0.74, needsCodexContext: true },
];

function stripHtml(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function firstMeaningfulExcerpt(text: string) {
  const codexIndex = text.toLowerCase().indexOf("codex");
  if (codexIndex >= 0) {
    return text.slice(Math.max(0, codexIndex - 140), codexIndex + 360).trim();
  }

  return text.slice(0, 500).trim();
}

function hasCodexContext(text: string, matchIndex: number) {
  const context = text.slice(Math.max(0, matchIndex - 240), matchIndex + 360);
  return /\b(codex|chatgpt|openai)\b/i.test(context);
}

function matchesRule(text: string, rule: KeywordRule) {
  const match = rule.pattern.exec(text);
  if (!match || match.index < 0) {
    return false;
  }

  if (rule.needsCodexContext && !hasCodexContext(text, match.index)) {
    return false;
  }

  return true;
}

export function hashContent(content: string) {
  return createHash("sha256").update(content).digest("hex");
}

export function extractSignalsFromText(source: ExtractableSource, htmlOrText: string): IngestedItem {
  const text = stripHtml(htmlOrText);
  const excerpt = firstMeaningfulExcerpt(text);
  const signals = keywordRules
    .filter((rule) => matchesRule(text, rule))
    .map((rule) => ({
      signal_type: rule.signalType,
      confidence: Math.min(1, rule.confidence * source.trust_weight),
      weight: rule.weight,
      summary: `${source.name}: ${rule.signalType.replaceAll("_", " ")}`,
      evidence_quote: excerpt,
    }));

  return {
    source_id: source.id ?? null,
    external_id: source.url,
    url: source.url,
    author_name: source.name,
    author_handle: source.handle,
    title: source.name,
    excerpt: excerpt || `No relevant public text found for ${source.name}.`,
    content_hash: hashContent(`${source.url}:${excerpt || text.slice(0, 1000)}`),
    raw_metadata: {
      sourcePlatform: source.platform,
      extractedAt: new Date().toISOString(),
    },
    fetch_status: "fetched",
    error_code: null,
    published_at: null,
    signals,
  };
}
