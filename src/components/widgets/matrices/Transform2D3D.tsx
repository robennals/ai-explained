"use client";

import { useState, useCallback } from "react";
import { WidgetContainer } from "../shared/WidgetContainer";
import { WidgetTabs } from "../shared/WidgetTabs";
import { ToggleControl } from "../shared/ToggleControl";
import { Transform2DBody } from "./Transform2D";
import { Transform3DBody } from "./Transform3D";

const TABS = [
  { id: "2d" as const, label: "2D" },
  { id: "3d" as const, label: "3D" },
];

type TabId = "2d" | "3d";

export function Transform2D3D() {
  const [activeTab, setActiveTab] = useState<TabId>("2d");
  const [activation, setActivation] = useState(false);
  const [resetNonce, setResetNonce] = useState(0);

  const handleReset = useCallback(() => {
    setActiveTab("2d");
    setActivation(false);
    setResetNonce((n) => n + 1);
  }, []);

  return (
    <WidgetContainer
      title="Spin It"
      description="The same matrix math rotates 2D and 3D worlds — which is why GPUs were built for games, and why they now run AI."
      onReset={handleReset}
    >
      <WidgetTabs tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === "2d" && (
        <div className="mb-3 flex items-center justify-end">
          <ToggleControl
            label="Apply activation (sigmoid)"
            checked={activation}
            onChange={setActivation}
          />
        </div>
      )}

      {activeTab === "2d" ? (
        <Transform2DBody
          key={`2d-${resetNonce}`}
          activation={activation}
        />
      ) : (
        <Transform3DBody key={`3d-${resetNonce}`} />
      )}

      <div className="mt-4 rounded-md bg-surface/60 px-4 py-3 text-xs text-muted">
        Games drove chips that do millions of these multiply-adds at once. A neural-net layer is also a matrix multiply — so the same chips ended up running AI.
      </div>
    </WidgetContainer>
  );
}
