import { SideNav } from "@/components/layout/SideNav";
import { MobileChapterNav } from "@/components/layout/MobileChapterNav";
import { Feedback } from "@/components/feedback/Feedback";

export default function TutorialLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex max-w-7xl">
      <SideNav />
      <MobileChapterNav />
      <main className="min-w-0 flex-1 px-6 py-10 lg:px-12">
        {children}
        <Feedback />
      </main>
    </div>
  );
}
