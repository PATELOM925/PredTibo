export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      sources: {
        Row: SourceRow;
        Insert: SourceInsert;
        Update: Partial<SourceInsert>;
      };
      source_items: {
        Row: SourceItemRow;
        Insert: SourceItemInsert;
        Update: Partial<SourceItemInsert>;
      };
      signals: {
        Row: SignalRow;
        Insert: SignalInsert;
        Update: Partial<SignalInsert>;
      };
      model_runs: {
        Row: ModelRunRow;
        Insert: ModelRunInsert;
        Update: Partial<ModelRunInsert>;
      };
      prediction_snapshots: {
        Row: PredictionSnapshotRow;
        Insert: PredictionSnapshotInsert;
        Update: Partial<PredictionSnapshotInsert>;
      };
      user_predictions: {
        Row: UserPredictionRow;
        Insert: UserPredictionInsert;
        Update: Partial<UserPredictionInsert>;
      };
      community_messages: {
        Row: CommunityMessageRow;
        Insert: CommunityMessageInsert;
        Update: Partial<CommunityMessageInsert>;
      };
      prediction_submission_windows: {
        Row: PredictionSubmissionWindowRow;
        Insert: PredictionSubmissionWindowInsert;
        Update: Partial<PredictionSubmissionWindowInsert>;
      };
      rate_limit_windows: {
        Row: RateLimitWindowRow;
        Insert: RateLimitWindowInsert;
        Update: Partial<RateLimitWindowInsert>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type SourceRow = {
  id: string;
  platform: "openai" | "x" | "linkedin" | "web" | "rss" | "manual";
  name: string;
  handle: string | null;
  url: string;
  trust_weight: number;
  crawl_policy: "official_or_allowed" | "api_required" | "manual_only" | "disabled";
  requires_api: boolean;
  is_active: boolean;
  last_fetch_status: string | null;
  last_fetched_at: string | null;
  created_at: string;
  updated_at: string;
};

export type SourceInsert = Omit<SourceRow, "id" | "created_at" | "updated_at" | "last_fetch_status" | "last_fetched_at"> &
  Partial<Pick<SourceRow, "id" | "created_at" | "updated_at" | "last_fetch_status" | "last_fetched_at">>;

export type SourceItemRow = {
  id: string;
  source_id: string | null;
  external_id: string | null;
  url: string;
  author_name: string | null;
  author_handle: string | null;
  title: string | null;
  excerpt: string;
  content_hash: string;
  raw_metadata: Json;
  fetch_status: "fetched" | "skipped" | "credentials_missing" | "blocked" | "failed";
  error_code: string | null;
  published_at: string | null;
  fetched_at: string;
  created_at: string;
};

export type SourceItemInsert = Omit<SourceItemRow, "id" | "fetched_at" | "created_at"> &
  Partial<Pick<SourceItemRow, "id" | "fetched_at" | "created_at">>;

export type SignalRow = {
  id: string;
  source_item_id: string | null;
  signal_type:
    | "codex_usage"
    | "codex_launch"
    | "limit_change"
    | "free_access"
    | "reset_language"
    | "official_confirmation"
    | "rumor"
    | "contradiction";
  confidence: number;
  weight: number;
  summary: string;
  evidence_quote: string | null;
  created_at: string;
};

export type SignalInsert = Omit<SignalRow, "id" | "created_at"> & Partial<Pick<SignalRow, "id" | "created_at">>;

export type ModelRunRow = {
  id: string;
  run_date: string;
  model_version: string;
  target_date: string;
  confidence_label: "Low" | "Medium" | "High";
  confidence_band_days: number;
  reset_signal_probability: number;
  rationale: string;
  evidence_signal_ids: string[];
  evidence_snapshot: Json;
  score_breakdown: Json;
  is_public: boolean;
  created_at: string;
};

export type ModelRunInsert = Omit<ModelRunRow, "id" | "created_at" | "run_date"> &
  Partial<Pick<ModelRunRow, "id" | "created_at" | "run_date">>;

export type PredictionSnapshotRow = {
  id: string;
  model_run_id: string | null;
  payload: Json;
  is_public: boolean;
  created_at: string;
};

export type PredictionSnapshotInsert = Omit<PredictionSnapshotRow, "id" | "created_at"> &
  Partial<Pick<PredictionSnapshotRow, "id" | "created_at">>;

export type UserPredictionRow = {
  id: string;
  predicted_at: string;
  display_name: string | null;
  note_private: string | null;
  rate_limit_hash: string;
  user_agent_hash: string | null;
  moderation_status: "private" | "approved" | "rejected";
  created_at: string;
};

export type UserPredictionInsert = Omit<UserPredictionRow, "id" | "created_at" | "moderation_status"> &
  Partial<Pick<UserPredictionRow, "id" | "created_at" | "moderation_status">>;

export type CommunityMessageRow = {
  id: string;
  display_name: string | null;
  body: string;
  rate_limit_hash: string;
  user_agent_hash: string | null;
  moderation_status: "pending" | "approved" | "rejected";
  created_at: string;
};

export type CommunityMessageInsert = Omit<CommunityMessageRow, "id" | "created_at" | "moderation_status"> &
  Partial<Pick<CommunityMessageRow, "id" | "created_at" | "moderation_status">>;

export type PredictionSubmissionWindowRow = {
  rate_limit_hash: string;
  window_start: string;
  submission_count: number;
  updated_at: string;
};

export type PredictionSubmissionWindowInsert = PredictionSubmissionWindowRow;

export type RateLimitWindowRow = {
  rate_limit_key: string;
  window_start: string;
  action_count: number;
  updated_at: string;
};

export type RateLimitWindowInsert = RateLimitWindowRow;
