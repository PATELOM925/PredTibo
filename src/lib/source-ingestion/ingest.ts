import type { SupabaseClient } from "@supabase/supabase-js";
import type { SourceRow } from "@/lib/db/types";
import { extractSignalsFromText } from "./extract";
import { isRestrictedPlatform, seedSources } from "./sources";
import type { IngestionSummary, SeedSource } from "./types";

async function upsertSource(admin: SupabaseClient, source: SeedSource) {
  const { data, error } = await admin
    .from("sources")
    .upsert(source, { onConflict: "url" })
    .select("*")
    .single();

  if (error) {
    throw new Error(`Failed to upsert source ${source.url}: ${error.message}`);
  }

  return data;
}

function hasRequiredCredentials(source: SourceRow) {
  if (source.platform === "x") {
    return Boolean(process.env.X_BEARER_TOKEN);
  }

  if (source.platform === "linkedin") {
    return Boolean(process.env.LINKEDIN_ACCESS_TOKEN);
  }

  return true;
}

async function fetchPublicSourceText(source: SourceRow) {
  if (source.crawl_policy === "disabled" || !source.is_active) {
    return { status: "skipped" as const, reason: "source_disabled", text: "" };
  }

  if (source.crawl_policy === "manual_only") {
    return { status: "skipped" as const, reason: "manual_only", text: "" };
  }

  if (isRestrictedPlatform(source.platform) && !hasRequiredCredentials(source)) {
    return { status: "credentials_missing" as const, reason: "credentials_missing", text: "" };
  }

  if (isRestrictedPlatform(source.platform)) {
    return { status: "skipped" as const, reason: "api_adapter_not_configured", text: "" };
  }

  const response = await fetch(source.url, {
    headers: {
      "user-agent": "PredTibo/0.2 compliant source monitor",
      accept: "text/html,application/xhtml+xml,application/xml,text/plain;q=0.9,*/*;q=0.5",
    },
    next: { revalidate: 3600 },
  });

  if (!response.ok) {
    return { status: "failed" as const, reason: `http_${response.status}`, text: "" };
  }

  return { status: "fetched" as const, reason: "ok", text: await response.text() };
}

export async function ingestConfiguredSources(admin: SupabaseClient): Promise<IngestionSummary> {
  const summary: IngestionSummary = {
    sourcesChecked: 0,
    itemsStored: 0,
    signalsStored: 0,
    skipped: [],
  };

  for (const seedSource of seedSources) {
    const source = await upsertSource(admin, seedSource);
    summary.sourcesChecked += 1;

    const fetched = await fetchPublicSourceText(source);
    if (fetched.status !== "fetched") {
      summary.skipped.push({ source: source.name, reason: fetched.reason });
      await admin
        .from("sources")
        .update({ last_fetch_status: fetched.status, last_fetched_at: new Date().toISOString() })
        .eq("id", source.id);
      continue;
    }

    const item = extractSignalsFromText(source, fetched.text);
    const { data: storedItem, error: itemError } = await admin
      .from("source_items")
      .upsert(
        {
          source_id: item.source_id,
          external_id: item.external_id,
          url: item.url,
          author_name: item.author_name,
          author_handle: item.author_handle,
          title: item.title,
          excerpt: item.excerpt,
          content_hash: item.content_hash,
          raw_metadata: item.raw_metadata,
          fetch_status: item.fetch_status,
          error_code: item.error_code,
          published_at: item.published_at,
        },
        { onConflict: "url" },
      )
      .select("*")
      .single();

    if (itemError) {
      throw new Error(`Failed to store source item ${item.url}: ${itemError.message}`);
    }

    summary.itemsStored += 1;

    if (storedItem && item.signals.length > 0) {
      const { error: deleteSignalError } = await admin.from("signals").delete().eq("source_item_id", storedItem.id);
      if (deleteSignalError) {
        throw new Error(`Failed to replace signals for ${item.url}: ${deleteSignalError.message}`);
      }

      const { error: signalError } = await admin.from("signals").insert(
        item.signals.map((signal) => ({
          source_item_id: storedItem.id,
          signal_type: signal.signal_type,
          confidence: signal.confidence,
          weight: signal.weight,
          summary: signal.summary,
          evidence_quote: signal.evidence_quote,
        })),
      );

      if (signalError) {
        throw new Error(`Failed to store signals for ${item.url}: ${signalError.message}`);
      }

      summary.signalsStored += item.signals.length;
    }

    await admin
      .from("sources")
      .update({ last_fetch_status: "fetched", last_fetched_at: new Date().toISOString() })
      .eq("id", source.id);
  }

  return summary;
}
