import { ImageResponse } from "next/og";
import { getLatestPublicState } from "@/lib/db/public-state";

export const alt = "PredTibo Codex Reset Weather";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";
export const revalidate = 300;

export default async function Image() {
  const state = await getLatestPublicState();

  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "stretch",
          background: "#050507",
          color: "#f8f9ff",
          display: "flex",
          flexDirection: "column",
          height: "100%",
          justifyContent: "space-between",
          padding: 64,
          width: "100%",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: 18, alignItems: "center" }}>
            <div
              style={{
                alignItems: "center",
                background: "linear-gradient(135deg, #ff8a1f, #8b5cf6)",
                borderRadius: 12,
                color: "#fff",
                display: "flex",
                fontSize: 28,
                fontWeight: 900,
                height: 64,
                justifyContent: "center",
                width: 64,
              }}
            >
              PT
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ color: "#ffb057", fontSize: 22, fontWeight: 900 }}>PredTibo</span>
              <span style={{ color: "#aeb4c7", fontSize: 20 }}>Codex reset weather</span>
            </div>
          </div>
          <span style={{ color: "#aeb4c7", fontSize: 22 }}>{state.updatedDisplay}</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 54 }}>
          <div
            style={{
              alignItems: "center",
              background: "linear-gradient(135deg, rgba(255,138,31,0.24), rgba(45,107,255,0.16))",
              border: "2px solid rgba(255,255,255,0.18)",
              borderRadius: 18,
              display: "flex",
              height: 250,
              justifyContent: "center",
              width: 250,
            }}
          >
            <span style={{ color: "#ffffff", fontSize: 76, fontWeight: 950 }}>
              {state.resetSignalProbability}%
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", maxWidth: 700 }}>
            <span style={{ color: "#ffb057", fontSize: 30, fontWeight: 900 }}>{state.pulseAnswer}</span>
            <span style={{ color: "#ffffff", fontSize: 70, fontWeight: 950, lineHeight: 0.98 }}>
              {state.pulseQuestion}
            </span>
            <span style={{ color: "#c5cad9", fontSize: 26, lineHeight: 1.3, marginTop: 24 }}>
              {state.pulseSummary}
            </span>
          </div>
        </div>

        <div
          style={{
            borderTop: "1px solid rgba(255,255,255,0.16)",
            color: "#aeb4c7",
            display: "flex",
            fontSize: 22,
            justifyContent: "space-between",
            paddingTop: 28,
          }}
        >
          <span>Fan forecast only. Not official OpenAI data.</span>
          <span>{state.evidence.length} receipts attached</span>
        </div>
      </div>
    ),
    size,
  );
}
