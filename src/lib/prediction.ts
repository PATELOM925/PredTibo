export type SourceLink = {
  label: string;
  url: string;
};

export type WatchEvent = {
  title: string;
  signal: string;
  impact: "low" | "medium" | "high";
  status: "known" | "watching" | "speculative";
};

export const prediction = {
  milestoneLabel: "Next visible Codex adoption moment",
  targetIso: "2026-06-12T17:00:00+05:30",
  targetDisplay: "June 12, 2026 at 5:00 PM IST",
  targetUtcDisplay: "June 12, 2026 at 11:30 AM UTC",
  headline: "PredTibo calls the next Codex public-signal moment for June 12.",
  confidence: "Medium",
  confidenceWindow: "Plus or minus 14 days",
  basis:
    "The model starts from OpenAI's April 16, 2026 public statement that Codex is used weekly by more than 3 million developers, then treats major launches, plan-limit changes, and public Codex mentions as signals that could move the community estimate.",
  disclaimer:
    "Fan prediction only. PredTibo has no private OpenAI data and does not know actual reset schedules or internal usage counts.",
  sourcesCheckedAt: "2026-05-07",
} as const;

export const sourceLinks: SourceLink[] = [
  {
    label: "OpenAI: Codex for almost everything",
    url: "https://openai.com/index/codex-for-almost-everything/",
  },
  {
    label: "OpenAI Help: Using Codex with your ChatGPT plan",
    url: "https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan",
  },
  {
    label: "OpenAI: Beyond rate limits",
    url: "https://openai.com/index/beyond-rate-limits/",
  },
  {
    label: "Vercel: CDN cache",
    url: "https://vercel.com/docs/caching/cdn-cache",
  },
];

export const watchEvents: WatchEvent[] = [
  {
    title: "Codex access or limit announcement",
    signal: "Any OpenAI Help update that changes plan access, temporary free access, or stated usage limits.",
    impact: "high",
    status: "watching",
  },
  {
    title: "OpenAI product launch week",
    signal: "A major OpenAI launch can create a second-wave Codex adoption bump through developer attention.",
    impact: "medium",
    status: "speculative",
  },
  {
    title: "Public Codex usage metric",
    signal: "A new official weekly-user, developer, or subscriber metric should replace the current estimate.",
    impact: "high",
    status: "watching",
  },
  {
    title: "Community reset chatter",
    signal: "Mentions of free limits or resets are treated as rumor until an OpenAI source confirms them.",
    impact: "low",
    status: "speculative",
  },
];
