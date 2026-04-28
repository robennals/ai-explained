import type { ReactNode } from "react";

// Diagram-only OG frame: 1200×630 with the widget centered, no title or
// brand chrome. The platform (Twitter / Slack / etc.) renders the page
// title and description below the image, so we don't repeat them here.
//
// We also hide the WidgetContainer's header bar, "Go to Next Tab" footer,
// and TryIt panel — none of those belong in a static share image.

const HIDE_CHROME_CSS = `
  .og-frame .widget-container { box-shadow: none; border: none; }
  .og-frame .widget-container > div:first-child { display: none; }
  .og-frame .widget-container > div.border-t { display: none; }
  .og-frame .widget-container > div.p-5 > div.mt-10.justify-center { display: none; }
  .og-frame .widget-container > div.p-5 { padding: 0; }
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
        background: "linear-gradient(135deg, #ffffff 0%, #eff6ff 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 48,
        boxSizing: "border-box",
        fontFamily:
          'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
        color: "#1a1a2e",
      }}
    >
      <style dangerouslySetInnerHTML={{ __html: HIDE_CHROME_CSS }} />
      <div
        style={{
          width: "100%",
          maxWidth: 1100,
          maxHeight: 530,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {children}
      </div>
    </div>
  );
}
