import { getSupabaseServer } from "./server";

export type PublicCommunityMessage = {
  id: string;
  displayName: string;
  body: string;
  createdAt: string;
};

export async function getApprovedCommunityMessages(limit = 8): Promise<PublicCommunityMessage[]> {
  const db = getSupabaseServer();
  if (!db) {
    return [];
  }

  const { data, error } = await db
    .from("community_messages")
    .select("id, display_name, body, created_at")
    .eq("moderation_status", "approved")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Could not load community messages: ${error.message}`);
  }

  return (data ?? []).map((message) => ({
    id: message.id,
    displayName: message.display_name || "Anonymous predictor",
    body: message.body,
    createdAt: message.created_at,
  }));
}
