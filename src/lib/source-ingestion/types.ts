import type { SourceInsert, SourceItemInsert, SignalInsert } from "@/lib/db/types";

export type SeedSource = SourceInsert & {
  id?: string;
};

export type IngestedItem = SourceItemInsert & {
  signals: Omit<SignalInsert, "source_item_id">[];
};

export type IngestionSummary = {
  sourcesChecked: number;
  itemsStored: number;
  signalsStored: number;
  skipped: Array<{ source: string; reason: string }>;
};
