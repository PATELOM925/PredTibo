import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let serverClient: SupabaseClient | null = null;
let publicReadClient: SupabaseClient | null = null;

export type SupabaseConfigState =
  | {
      configured: true;
      url: string;
      key: string;
      mode: "service_role";
      serverActionSecret: string | null;
    }
  | {
      configured: true;
      url: string;
      key: string;
      mode: "server_rpc";
      serverActionSecret: string;
    }
  | {
      configured: false;
      reason:
        | "missing_url"
        | "missing_supabase_key"
        | "missing_server_action_secret"
        | "missing_service_role_key";
    };

export function getSupabaseConfigState(): SupabaseConfigState {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serverActionSecret = process.env.SERVER_ACTION_SECRET ?? null;
  const allowLegacyServerRpc = process.env.PREDTIBO_ALLOW_SERVER_RPC_FALLBACK === "1";
  const key = serviceKey ?? publishableKey;

  if (!url) {
    return { configured: false, reason: "missing_url" };
  }

  if (!key) {
    return { configured: false, reason: "missing_supabase_key" };
  }

  if (serviceKey) {
    return { configured: true, url, key: serviceKey, mode: "service_role", serverActionSecret };
  }

  if (!allowLegacyServerRpc) {
    return { configured: false, reason: "missing_service_role_key" };
  }

  if (!serverActionSecret) {
    return { configured: false, reason: "missing_server_action_secret" };
  }

  return { configured: true, url, key, mode: "server_rpc", serverActionSecret };
}

export function getSupabaseServer() {
  const config = getSupabaseConfigState();
  if (!config.configured) {
    return null;
  }

  if (!serverClient) {
    serverClient = createClient(config.url, config.key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });
  }

  return serverClient;
}

export const getSupabaseAdmin = getSupabaseServer;

export function getSupabasePublicReadServer() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !publishableKey) {
    return null;
  }

  if (!publicReadClient) {
    publicReadClient = createClient(url, publishableKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });
  }

  return publicReadClient;
}

export function getDatabaseNotConfiguredPayload() {
  const config = getSupabaseConfigState();
  return {
    error: "database_not_configured",
    reason: config.configured ? null : config.reason,
  };
}
