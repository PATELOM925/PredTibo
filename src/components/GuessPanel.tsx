"use client";

import { Clipboard, RotateCcw, Save } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type GuessPanelProps = {
  targetIso: string;
  serverSubmissionsEnabled: boolean;
};

type StoredGuess = {
  guessAt: string;
  displayName: string;
  note: string;
};

const STORAGE_KEY = "predtibo.guess.v1";

function loadGuessFromUrl(): StoredGuess | null {
  if (typeof window === "undefined") {
    return null;
  }

  const params = new URLSearchParams(window.location.search);
  const guessAt = params.get("guessAt");
  if (!guessAt) {
    return null;
  }

  return {
    guessAt,
    displayName: params.get("name") ?? "",
    note: params.get("note") ?? "",
  };
}

function loadStoredGuess(): StoredGuess | null {
  if (typeof window === "undefined") {
    return null;
  }

  const urlGuess = loadGuessFromUrl();
  if (urlGuess) {
    return urlGuess;
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as StoredGuess;
    if (
      typeof parsed.guessAt !== "string" ||
      typeof parsed.note !== "string" ||
      typeof parsed.displayName !== "string"
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function toInputValue(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const pad = (value: number) => value.toString().padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
}

export function GuessPanel({ targetIso, serverSubmissionsEnabled }: GuessPanelProps) {
  const [guessAt, setGuessAt] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [note, setNote] = useState("");
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [status, setStatus] = useState("Not saved yet.");

  useEffect(() => {
    let cancelled = false;
    const frame = window.requestAnimationFrame(() => {
      if (cancelled) {
        return;
      }

      const loaded = loadStoredGuess();
      if (loaded) {
        setGuessAt(loaded.guessAt);
        setDisplayName(loaded.displayName);
        setNote(loaded.note);
        return;
      }

      setGuessAt(toInputValue(targetIso));
    });

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(frame);
    };
  }, [targetIso]);

  const shareUrl = useMemo(() => {
    if (!guessAt || typeof window === "undefined") {
      return "";
    }

    const url = new URL(window.location.href);
    url.searchParams.set("guessAt", guessAt);
    if (displayName.trim()) {
      url.searchParams.set("name", displayName.trim());
    } else {
      url.searchParams.delete("name");
    }
    if (note.trim()) {
      url.searchParams.set("note", note.trim());
    } else {
      url.searchParams.delete("note");
    }
    return url.toString();
  }, [displayName, guessAt, note]);

  function saveLocalGuess(message = "Saved locally in this browser.") {
    const nextGuess = { guessAt, displayName: displayName.trim(), note: note.trim() };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextGuess));
    setSaved(true);
    setCopied(false);
    setStatus(message);
  }

  async function saveGuess() {
    const predictedAt = new Date(guessAt);
    if (Number.isNaN(predictedAt.getTime())) {
      setStatus("Choose a valid date and time first.");
      return;
    }

    if (!serverSubmissionsEnabled) {
      saveLocalGuess("Database is not configured yet, so this was saved locally.");
      return;
    }

    setStatus("Saving prediction...");
    try {
      const response = await fetch("/api/predictions/submit", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          predictedAt: predictedAt.toISOString(),
          displayName,
          note,
        }),
      });

      if (response.status === 503) {
        saveLocalGuess("Database is not configured yet, so this was saved locally.");
        return;
      }

      if (response.status === 429) {
        setStatus("Too many predictions from this browser or network. Try again later.");
        return;
      }

      if (!response.ok) {
        saveLocalGuess("Server save failed, so this was saved locally.");
        return;
      }

      saveLocalGuess("Prediction submitted and saved locally.");
    } catch {
      saveLocalGuess("Network save failed, so this was saved locally.");
    }
  }

  function clearGuess() {
    window.localStorage.removeItem(STORAGE_KEY);
    setGuessAt(toInputValue(targetIso));
    setDisplayName("");
    setNote("");
    setSaved(false);
    setCopied(false);
    setStatus("Not saved yet.");
  }

  async function copyShareLink() {
    if (!shareUrl) {
      return;
    }

    await window.navigator.clipboard.writeText(shareUrl);
    setCopied(true);
  }

  return (
    <article className="guess-panel">
      <div>
        <p className="panel-kicker">Your prediction</p>
        <h2>Pick your Codex moment</h2>
        <p>
          {serverSubmissionsEnabled
            ? "PredTibo stores this anonymously through the server route. Notes stay private until moderation exists."
            : "The database is not configured yet, so this stays in your browser and share links only."}
        </p>
      </div>

      <label>
        Date and time
        <input
          type="datetime-local"
          value={guessAt}
          onChange={(event) => {
            setGuessAt(event.target.value);
            setSaved(false);
            setCopied(false);
          }}
        />
      </label>

      <label>
        Display name
        <input
          type="text"
          value={displayName}
          maxLength={40}
          placeholder="Optional"
          onChange={(event) => {
            setDisplayName(event.target.value);
            setSaved(false);
            setCopied(false);
            setStatus("Not saved yet.");
          }}
        />
      </label>

      <label>
        Note
        <textarea
          value={note}
          maxLength={160}
          placeholder="Why this date?"
          onChange={(event) => {
            setNote(event.target.value);
            setSaved(false);
            setCopied(false);
            setStatus("Not saved yet.");
          }}
        />
      </label>

      <div className="button-row">
        <button type="button" onClick={saveGuess}>
          <Save aria-hidden="true" size={17} />
          Save
        </button>
        <button type="button" onClick={copyShareLink} disabled={!shareUrl}>
          <Clipboard aria-hidden="true" size={17} />
          {copied ? "Copied" : "Copy link"}
        </button>
        <button className="secondary-button" type="button" onClick={clearGuess}>
          <RotateCcw aria-hidden="true" size={17} />
          Reset
        </button>
      </div>

      <p className="form-status" aria-live="polite">
        {status}
      </p>
    </article>
  );
}
