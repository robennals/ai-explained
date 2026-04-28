import type { ReactNode } from "react";

interface OgCardProps {
  title: string;
  subtitle: string;
  number: string;
  diagram: ReactNode | null;
}

export function OgCard({ title, subtitle, number, diagram }: OgCardProps) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        width: 1200,
        height: 630,
        background: "linear-gradient(135deg, #ffffff 0%, #eff6ff 100%)",
        display: "flex",
        flexDirection: "column",
        padding: 64,
        fontFamily:
          'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
        color: "#1a1a2e",
        boxSizing: "border-box",
      }}
    >
      {/* Top brand bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            background: "#3b82f6",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#ffffff",
            fontWeight: 700,
            fontSize: 18,
          }}
        >
          AI
        </div>
        <div style={{ fontSize: 18, fontWeight: 600, color: "#374151" }}>
          Learn AI Layer by Layer
        </div>
        {number && (
          <div
            style={{
              marginLeft: "auto",
              fontSize: 14,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "#6b7280",
            }}
          >
            {number}
          </div>
        )}
      </div>

      {/* Title block */}
      <div style={{ marginTop: 56 }}>
        <div
          style={{
            fontSize: 72,
            fontWeight: 700,
            lineHeight: 1.05,
            letterSpacing: "-0.02em",
            color: "#1a1a2e",
            maxWidth: 1000,
          }}
        >
          {title}
        </div>
        <div
          style={{
            marginTop: 20,
            fontSize: 28,
            fontWeight: 400,
            lineHeight: 1.3,
            color: "#4b5563",
            maxWidth: 1000,
          }}
        >
          {subtitle}
        </div>
      </div>

      {/* Diagram (if any) */}
      {diagram && (
        <div
          style={{
            marginTop: "auto",
            display: "flex",
            justifyContent: "center",
            alignItems: "flex-end",
            maxHeight: 280,
            overflow: "hidden",
          }}
        >
          {diagram}
        </div>
      )}
    </div>
  );
}
