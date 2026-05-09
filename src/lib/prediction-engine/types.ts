import type { SignalRow } from "@/lib/db/types";

export type Evidence = {
  id: string;
  title: string;
  sourceLabel: string;
  url: string;
  excerpt: string;
  signalType: SignalRow["signal_type"];
  confidence: number;
  weight: number;
  observedAt: string;
};

export type PublicPredictionState = {
  generatedAt: string;
  modelVersion: string;
  targetIso: string;
  targetDisplay: string;
  targetUtcDisplay: string;
  headline: string;
  pulseQuestion: string;
  pulseAnswer: string;
  pulseSummary: string;
  updatedDisplay: string;
  nextUpdateDisplay: string;
  shareText: string;
  confidence: "Low" | "Medium" | "High";
  confidenceWindow: string;
  resetSignalProbability: number;
  resetMeterLabel: string;
  rationale: string;
  uncertainty: string;
  evidence: Evidence[];
  sourcePolicy: string;
};

export type ScoringInputSignal = {
  id: string;
  signalType: SignalRow["signal_type"];
  confidence: number;
  weight: number;
  sourceTrust: number;
  observedAt: string;
  summary: string;
  url: string;
  sourceLabel: string;
  excerpt: string;
};

export type ScoringResult = {
  modelVersion: string;
  targetIso: string;
  confidence: "Low" | "Medium" | "High";
  confidenceBandDays: number;
  resetSignalProbability: number;
  rationale: string;
  uncertainty: string;
  evidence: Evidence[];
  scoreBreakdown: {
    resetStrength: number;
    adoptionStrength: number;
    overallStrength: number;
    evidenceCount: number;
  };
};
