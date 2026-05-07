import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let adminClient: SupabaseClient | null = null;

export type SupabaseConfigState =
  | { configured: true; url: string; serviceKey: string }
  | { configured: false; reason: "missing_url" | "missing_service_key" };

export function getSupabaseConfigState(): SupabaseConfigState {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY;

  if (!url) {
    return { configured: false, reason: "missing_url" };
  }

  if (!serviceKey) {
    return { configured: false, reason: "missing_service_key" };
  }

  return { configured: true, url, serviceKey };
}

export function getSupabaseAdmin() {
  const config = getSupabaseConfigState();
  if (!config.configured) {
    return null;
  }

  if (!adminClient) {
    adminClient = createClient(config.url, config.serviceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  return adminClient;
}

export function getDatabaseNotConfiguredPayload() {
  const config = getSupabaseConfigState();
  return {
    error: "database_not_configured",
    reason: config.configured ? null : config.reason,
  };
}
