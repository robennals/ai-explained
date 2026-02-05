import { SideNav } from "@/components/layout/SideNav";

export default function TutorialLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex max-w-7xl">
      <SideNav />
      <main className="min-w-0 flex-1 px-6 py-10 lg:px-12">{children}</main>
    </div>
  );
}
