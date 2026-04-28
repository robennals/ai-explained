import { ChapterList } from "./ChapterList";

export function SideNav() {
  return (
    <nav className="scrollbar-autohide sticky top-14 h-[calc(100vh-3.5rem)] w-64 shrink-0 border-r border-border overflow-y-auto py-6 pr-4 hidden lg:block">
      <ChapterList />
    </nav>
  );
}
