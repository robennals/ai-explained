// Site-wide OG card — used by the homepage and as a fallback for chapters
// that don't have a designated OG diagram. This one keeps the brand and
// site title because it represents the site itself, not a specific chapter.

export default function SiteOgPage() {
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
        alignItems: "center",
        justifyContent: "center",
        padding: 64,
        boxSizing: "border-box",
        fontFamily:
          'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
        color: "#1a1a2e",
        textAlign: "center",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          marginBottom: 32,
        }}
      >
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 14,
            background: "#3b82f6",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#ffffff",
            fontWeight: 700,
            fontSize: 32,
          }}
        >
          AI
        </div>
      </div>
      <div
        style={{
          fontSize: 88,
          fontWeight: 700,
          lineHeight: 1.05,
          letterSpacing: "-0.02em",
          maxWidth: 1000,
        }}
      >
        Learn AI Layer by Layer
      </div>
      <div
        style={{
          marginTop: 24,
          fontSize: 32,
          fontWeight: 400,
          lineHeight: 1.3,
          color: "#4b5563",
          maxWidth: 900,
        }}
      >
        An interactive guide to understanding AI from first principles
      </div>
    </div>
  );
}
