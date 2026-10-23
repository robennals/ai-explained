import { AgentsArt } from "./AgentsArt";
import { AttentionArt } from "./AttentionArt";
import { ComputationArt } from "./ComputationArt";
import { ConversationsArt } from "./ConversationsArt";
import { EmbeddingsArt } from "./EmbeddingsArt";
import { NeuronsArt } from "./NeuronsArt";
import { NextWordArt } from "./NextWordArt";
import { OptimizationArt } from "./OptimizationArt";
import { PositionsArt } from "./PositionsArt";
import { PostTrainingArt } from "./PostTrainingArt";
import { ReasoningArt } from "./ReasoningArt";
import { RiskArt } from "./RiskArt";
import { SocietyArt } from "./SocietyArt";
import { TransformersArt } from "./TransformersArt";
import { VectorsArt } from "./VectorsArt";

const ART_BY_SLUG: Record<string, React.ComponentType<{ accent: string }>> = {
  computation: ComputationArt,
  optimization: OptimizationArt,
  neurons: NeuronsArt,
  vectors: VectorsArt,
  embeddings: EmbeddingsArt,
  "next-word-prediction": NextWordArt,
  attention: AttentionArt,
  positions: PositionsArt,
  transformers: TransformersArt,
  "post-training": PostTrainingArt,
  conversations: ConversationsArt,
  reasoning: ReasoningArt,
  agents: AgentsArt,
  society: SocietyArt,
  risk: RiskArt,
};

/**
 * The illustration for a chapter card. A chapter without a bespoke
 * illustration gets a quiet placeholder showing its number, so a newly
 * finished chapter can appear on the home page before its art exists.
 */
export function ChapterArt({
  slug,
  number,
  accent,
}: {
  slug: string;
  number: number;
  accent: string;
}) {
  const Art = ART_BY_SLUG[slug];
  if (Art) return <Art accent={accent} />;
  return (
    <svg viewBox="0 0 320 180" className="h-full w-full" aria-hidden>
      <defs>
        <pattern id={`dots-${slug}`} width={16} height={16} patternUnits="userSpaceOnUse">
          <circle cx={2} cy={2} r={1.2} fill={accent} fillOpacity={0.25} />
        </pattern>
      </defs>
      <rect width={320} height={180} fill={`url(#dots-${slug})`} />
      <text
        x={160}
        y={112}
        fontSize={64}
        fontWeight={700}
        textAnchor="middle"
        fill={accent}
        fillOpacity={0.35}
        fontFamily="var(--font-geist-mono)"
      >
        {number}
      </text>
    </svg>
  );
}
