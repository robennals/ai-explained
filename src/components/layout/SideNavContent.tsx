import { ChapterList } from "./ChapterList";
import { ChapterMenu } from "./ChapterMenu";
import { ChapterSections } from "./ChapterSections";

interface SideNavContentProps {
  /** Called when the user clicks any link. Used by mobile drawer to close itself. */
  onNavigate?: () => void;
}

/**
 * What the sidebar and the mobile drawer both show: a menu for switching
 * chapter, then the sections of the current one.
 */
export function SideNavContent({ onNavigate }: SideNavContentProps) {
  return (
    <>
      <div className="mb-6 pl-3">
        <ChapterMenu onNavigate={onNavigate} />
      </div>
      <ChapterSections
        onNavigate={onNavigate}
        fallback={<ChapterList onNavigate={onNavigate} />}
      />
    </>
  );
}
