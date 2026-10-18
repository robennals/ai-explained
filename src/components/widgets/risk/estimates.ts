/**
 * Published estimates of the chance of AI catastrophe from widely respected
 * researchers, leaders and forecasting studies. People define "catastrophe"
 * differently, so each entry says what its number is a chance of.
 */

import type { Source } from "@/components/widgets/shared/caseTypes";

export interface Estimate {
  who: string;
  role: string;
  /** The estimate as the person stated it, e.g. "10–20%" or "non-zero". */
  label: string;
  /** Low and high ends in percent, for drawing; absent when no number was given. */
  range?: [number, number];
  /** What the estimate is about, as a full sentence in the person's own framing. */
  statement: string;
  year: number;
  sources: Source[];
}

export const estimates: Estimate[] = [
  {
    who: "Paul Christiano",
    role: "Alignment researcher; former head of AI safety at the US AI Safety Institute",
    label: "22%",
    range: [22, 22],
    statement: "Chance of an AI takeover, and 46% that humanity irreversibly messes up its future soon after powerful AI.",
    year: 2023,
    sources: [{ label: "Christiano, My views on doom", url: "https://www.lesswrong.com/posts/xWMqsvHapP3nwdSW8/my-views-on-doom" }],
  },
  {
    who: "Dario Amodei",
    role: "Chief executive of Anthropic",
    label: "10–25%",
    range: [10, 25],
    statement: "Chance of something going \"really quite catastrophically wrong on the scale of human civilisation\".",
    year: 2025,
    sources: [{ label: "Axios", url: "https://www.axios.com/2025/09/17/anthropic-dario-amodei-p-doom-25-percent" }],
  },
  {
    who: "Yoshua Bengio",
    role: "Winner of the Turing Award, computing's top prize; one of the founders of deep learning",
    label: "About 20%",
    range: [20, 20],
    statement: "Chance of a catastrophic outcome from AI.",
    year: 2023,
    sources: [{ label: "Wikipedia, P(doom)", url: "https://en.wikipedia.org/wiki/P(doom)" }],
  },
  {
    who: "Geoffrey Hinton",
    role: "Winner of a Nobel Prize and the Turing Award, computing's top prize; one of the founders of deep learning",
    label: "10–20%",
    range: [10, 20],
    statement: "Chance of AI wiping out humanity within about 30 years.",
    year: 2024,
    sources: [{ label: "Wikipedia, P(doom)", url: "https://en.wikipedia.org/wiki/P(doom)" }],
  },
  {
    who: "Elon Musk",
    role: "Chief executive of Tesla and SpaceX; founder of xAI",
    label: "10–20%",
    range: [10, 20],
    statement: "Chance that AI goes badly, though he argues the likely good outcome outweighs it.",
    year: 2024,
    sources: [{ label: "TechRadar", url: "https://www.techradar.com/pro/top-ai-researcher-says-ai-will-end-humanity-and-we-should-stop-developing-it-now-but-dont-worry-elon-musk-disagrees" }],
  },
  {
    who: "AI researchers (survey)",
    role: "2,778 researchers who had published at top AI conferences",
    label: "5% (median answer)",
    range: [5, 5],
    statement: "Median chance, among 2,778 AI researchers, of AI causing human extinction or a similarly permanent loss of control.",
    year: 2023,
    sources: [{ label: "AI Impacts 2023 survey", url: "https://wiki.aiimpacts.org/ai_timelines/predictions_of_human-level_ai_timelines/ai_timeline_surveys/2023_expert_survey_on_progress_in_ai" }],
  },
  {
    who: "Demis Hassabis",
    role: "Chief executive of Google DeepMind; Nobel Prize winner",
    label: "\"non-zero\"",
    statement: "His chance of catastrophic outcomes, which he says deserve very serious attention.",
    year: 2025,
    sources: [{ label: "Axios", url: "https://www.axios.com/2025/12/05/ai-deepmind-hassabis-gemini" }],
  },
  {
    who: "Yann LeCun",
    role: "Winner of the Turing Award, computing's top prize; one of the founders of deep learning",
    label: "Not worried \"at all\"",
    range: [0, 0],
    statement: "About AI wiping out humanity. He calls warnings that \"AI can kill us all\" \"incredibly destructive\".",
    year: 2026,
    sources: [{ label: "Fortune", url: "https://fortune.com/2026/10/01/ai-godfather-yann-lecun-has-zero-concerns-about-human-extinction-says-anthropic-ceo-dario-amodei-is-deuded/" }],
  },
];
