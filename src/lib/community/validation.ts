export type CommunityMessagePayload = {
  displayName?: unknown;
  body?: unknown;
};

const URL_PATTERN = /(?:https?:\/\/|www\.|[a-z0-9-]+\.[a-z]{2,})/i;

export function normalizeCommunityText(value: string, maxLength: number) {
  return value.replace(/\s+/g, " ").trim().slice(0, maxLength);
}

export function parseCommunityMessagePayload(payload: CommunityMessagePayload) {
  if (typeof payload.body !== "string") {
    return { ok: false as const, error: "message_required" };
  }

  const body = normalizeCommunityText(payload.body, 280);
  if (!body) {
    return { ok: false as const, error: "message_required" };
  }

  if (URL_PATTERN.test(body)) {
    return { ok: false as const, error: "links_not_allowed" };
  }

  const displayName =
    typeof payload.displayName === "string" ? normalizeCommunityText(payload.displayName, 40) : "";

  return {
    ok: true as const,
    data: {
      displayName: displayName || null,
      body,
    },
  };
}
