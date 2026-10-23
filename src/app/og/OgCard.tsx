import type { ReactNode } from "react";

// Diagram-only OG frame: 1200×630 with the widget filling the canvas, no
// title or brand chrome. The platform (Twitter / Slack / etc.) renders the
// page title and description below the image, so we don't repeat them here.
//
// We strip the WidgetContainer's header bar, "Go to Next Tab" footer, and
// TryIt panel — none of those belong in a static share image.

const HIDE_CHROME_CSS = `
  .og-frame .widget-container {
    box-shadow: none !important;
    border: none !important;
    border-radius: 0 !important;
    margin: 0 !important;
    background: transparent !important;
  }
  .og-frame .widget-container > div:first-child { display: none !important; }
  .og-frame .widget-container > div.border-t { display: none !important; }
  .og-frame .widget-container > div.p-5 > div.mt-10.justify-center { display: none !important; }
  .og-frame .widget-container > div.p-5 { padding: 0 !important; }
  /* TransformerOverview's status hint — only that widget uses aria-live. */
  .og-frame [aria-live="polite"] { display: none !important; }
`;

export function OgCard({ children }: { children: ReactNode }) {
  return (
    <div
      className="og-frame"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        width: 1200,
        height: 630,
        background: "#ffffff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxSizing: "border-box",
        overflow: "hidden",
        fontFamily:
          'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
        color: "#1a1a2e",
      }}
    >
      <style dangerouslySetInnerHTML={{ __html: HIDE_CHROME_CSS }} />
      {children}
    </div>
  );
}
