import { notFound } from "next/navigation";
import { getChapter } from "@/lib/curriculum";
import { getOgDiagram } from "@/lib/og-diagrams";
import { OgCard } from "../OgCard";

export default async function ChapterOgPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const ch = getChapter(slug);
  if (!ch) notFound();

  const diagram = getOgDiagram(slug);

  return (
    <OgCard
      title={ch.title}
      subtitle={ch.subtitle}
      number={ch.section === "appendix" ? "Appendix" : `Chapter ${ch.id}`}
      diagram={diagram?.node ?? null}
    />
  );
}
