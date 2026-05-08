"use client";

import { FormEvent, useState } from "react";
import { MessageCircle, RefreshCw, Send, ShieldCheck } from "lucide-react";
import type { PublicCommunityMessage } from "@/lib/db/community";

type SubmitState = "idle" | "submitting" | "submitted" | "error";

type CommunityCenterProps = {
  initialMessages: PublicCommunityMessage[];
  serverSubmissionsEnabled: boolean;
};

function formatMessageTime(iso: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function CommunityCenter({ initialMessages, serverSubmissionsEnabled }: CommunityCenterProps) {
  const [messages, setMessages] = useState(initialMessages);
  const [displayName, setDisplayName] = useState("");
  const [body, setBody] = useState("");
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [statusText, setStatusText] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  async function refreshMessages() {
    setIsRefreshing(true);
    try {
      const response = await fetch("/api/community/messages");
      const payload = (await response.json()) as { messages?: PublicCommunityMessage[] };
      setMessages(payload.messages ?? []);
    } finally {
      setIsRefreshing(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!serverSubmissionsEnabled) {
      setSubmitState("error");
      setStatusText("Supabase community posting is not configured on this deployment yet.");
      return;
    }

    setSubmitState("submitting");
    setStatusText("");

    const response = await fetch("/api/community/messages", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ displayName, body }),
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      setSubmitState("error");
      setStatusText(payload.error === "links_not_allowed" ? "Links are disabled in the community board for now." : "Could not post that message.");
      return;
    }

    setSubmitState("submitted");
    setStatusText("Message received. It appears on the board after approval.");
    setBody("");
  }

  return (
    <section className="community-panel" aria-label="Community Center">
      <div className="community-copy">
        <p className="panel-kicker">
          <MessageCircle aria-hidden="true" size={17} />
          Community Center
        </p>
        <h2>Drop a Codex reset read.</h2>
        <p>
          Share a short public-signal take while the main prediction keeps its evidence trail. Messages are rate-limited
          and reviewed before they show publicly.
        </p>
        <div className="community-guardrail">
          <ShieldCheck aria-hidden="true" size={17} />
          No login, no public raw notes, no unsupported scraping.
        </div>
      </div>

      <form className="community-form" onSubmit={handleSubmit}>
        <label htmlFor="community-name">Name</label>
        <input
          id="community-name"
          maxLength={40}
          placeholder="Anonymous predictor"
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
        />
        <label htmlFor="community-message">Message</label>
        <textarea
          id="community-message"
          maxLength={280}
          placeholder="Today feels like a medium reset-signal day because..."
          rows={4}
          value={body}
          onChange={(event) => setBody(event.target.value)}
          required
        />
        <div className="form-footer">
          <span>{280 - body.length} chars</span>
          <button disabled={submitState === "submitting"} type="submit">
            <Send aria-hidden="true" size={17} />
            Post
          </button>
        </div>
        {statusText ? <p className={`form-status ${submitState === "error" ? "error" : ""}`}>{statusText}</p> : null}
      </form>

      <div className="message-board">
        <div className="board-header">
          <h3>Approved board</h3>
          <button className="icon-button" type="button" onClick={refreshMessages} aria-label="Refresh community messages">
            <RefreshCw aria-hidden="true" size={17} className={isRefreshing ? "spinning" : undefined} />
          </button>
        </div>
        {messages.length > 0 ? (
          <ul>
            {messages.map((message) => (
              <li key={message.id}>
                <div>
                  <strong>{message.displayName}</strong>
                  <span>{formatMessageTime(message.createdAt)}</span>
                </div>
                <p>{message.body}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted">No approved community posts yet.</p>
        )}
      </div>
    </section>
  );
}
