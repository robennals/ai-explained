"use client";

import { useState, useCallback } from "react";
import { WidgetContainer } from "../shared/WidgetContainer";
import { WidgetTabs } from "../shared/WidgetTabs";

interface Stage {
  icon: string;
  name: string;
  when: string;
  change: string;
  better: string;
}

interface Story {
  id: StoryId;
  label: string;
  /** Labels for a stage's two lines; the first stage uses startLabel instead of changeLabel */
  startLabel: string;
  changeLabel: string;
  betterLabel: string;
  /** Show each stage's change as a quotation (for stories about wording) */
  changeIsQuote?: boolean;
  stages: Stage[];
}

type StoryId = "eye" | "airplane" | "phone" | "medicine" | "english";

const INVENTION_LABELS = {
  startLabel: "Starting point: ",
  changeLabel: "Small change: ",
  betterLabel: "What got better: ",
};

const STORIES: Story[] = [
  {
    id: "eye",
    label: "The eye",
    ...INVENTION_LABELS,
    stages: [
      {
        icon: "🟤",
        name: "Light-sensitive patch",
        when: "Over 500 million years ago",
        change: "A few skin cells start reacting to light",
        better: "The animal can tell day from night, or notice a shadow passing over it",
      },
      {
        icon: "🥣",
        name: "Cup-shaped pit",
        when: "Many generations later",
        change: "The patch sinks slightly into a dip",
        better: "Light from different directions hits different cells, so the animal can tell which way the shadow came from",
      },
      {
        icon: "🕳️",
        name: "Pinhole eye",
        when: "Many generations later",
        change: "The opening of the cup narrows",
        better: "A narrow opening projects a rough, blurry image, like a pinhole camera",
      },
      {
        icon: "💧",
        name: "Sealed, fluid-filled eye",
        when: "Many generations later",
        change: "A clear layer of skin grows over the opening",
        better: "Dirt and parasites stay out, and the fluid inside starts to bend light",
      },
      {
        icon: "🔍",
        name: "Eye with a lens",
        when: "Many generations later",
        change: "The clear covering thickens into a lens",
        better: "Light gets focused into a sharp image",
      },
      {
        icon: "👁️",
        name: "Modern eye",
        when: "Today",
        change: "Muscles to reshape the lens and an iris to resize the pupil",
        better: "Focuses near and far, and works in starlight or blinding sun",
      },
    ],
  },
  {
    id: "airplane",
    label: "The airplane",
    ...INVENTION_LABELS,
    stages: [
      {
        icon: "🪁",
        name: "Kite",
        when: "1899",
        change: "The Wright brothers twist the wing tips of a kite",
        better: "Twisting the wings lets them steer it left and right",
      },
      {
        icon: "🛩️",
        name: "First glider",
        when: "1900",
        change: "They scale the kite up to carry a person",
        better: "It flies, but with far less lift than the published tables predicted",
      },
      {
        icon: "🛩️",
        name: "Bigger glider",
        when: "1901",
        change: "Larger wings with a deeper curve",
        better: "Still disappointing. They start to suspect the published lift tables are wrong",
      },
      {
        icon: "🌬️",
        name: "Wind tunnel",
        when: "Late 1901",
        change: "They build a wind tunnel and test about 200 small wing shapes",
        better: "Now they have their own, accurate measurements of which shapes lift best",
      },
      {
        icon: "🛩️",
        name: "Redesigned glider",
        when: "1902",
        change: "Longer, thinner wings from the tunnel data, plus a movable rudder",
        better: "Hundreds of controlled glides. The steering problem is solved",
      },
      {
        icon: "✈️",
        name: "The Flyer",
        when: "1903",
        change: "Add a light engine and propellers they designed themselves",
        better: "The first powered flight: 12 seconds and 120 feet",
      },
      {
        icon: "✈️",
        name: "Flyer III",
        when: "1905",
        change: "Many small fixes to control and balance",
        better: "Flights of over half an hour, with banks, turns and circles",
      },
    ],
  },
  {
    id: "phone",
    label: "The phone",
    ...INVENTION_LABELS,
    stages: [
      {
        icon: "☎️",
        name: "Telephone",
        when: "1876",
        change: "Send a voice down a wire",
        better: "Talk to someone else, but only on the one phone wired directly to yours",
      },
      {
        icon: "🔌",
        name: "Manual switchboard",
        when: "1878",
        change: "Wire every phone in town to a central office, where an operator plugs cables into a board to connect calls",
        better: "Ask the operator for anyone on the network, and they plug you through",
      },
      {
        icon: "⚙️",
        name: "Automatic exchange",
        when: "1892",
        change: "Replace the operator with mechanical switches that the caller controls, first with buttons and later with a dial",
        better: "Calls connect by themselves, day or night, without an operator",
      },
      {
        icon: "📞",
        name: "Car phone",
        when: "1946",
        change: "Replace the wire with a radio link",
        better: "Make calls on the move, from a box in the trunk of a car",
      },
      {
        icon: "🧱",
        name: "Handheld \"brick\" phone",
        when: "1983",
        change: "Shrink the radio enough to hold in your hand",
        better: "Make calls while walking around (for about 30 minutes per charge)",
      },
      {
        icon: "📱",
        name: "Flip phone",
        when: "1996",
        change: "Smaller parts, a folding case, a tiny screen",
        better: "Fits in a pocket, and you can send short text messages",
      },
      {
        icon: "⌨️",
        name: "BlackBerry",
        when: "2002",
        change: "A bigger screen and a tiny keyboard",
        better: "Read and write email anywhere",
      },
      {
        icon: "📱",
        name: "iPhone",
        when: "2007",
        change: "Replace the keyboard with a touchscreen",
        better: "The whole front becomes a screen that can show anything, including the web",
      },
    ],
  },
  {
    id: "medicine",
    label: "Medicine",
    startLabel: "What people believed: ",
    changeLabel: "New understanding: ",
    betterLabel: "What doctors did: ",
    stages: [
      {
        icon: "🔮",
        name: "Spirits and gods",
        when: "Ancient times",
        change: "Illness is a punishment from the gods, or the work of evil spirits",
        better: "Prayers, charms, offerings and rituals to drive the spirits out",
      },
      {
        icon: "⚖️",
        name: "The four humours",
        when: "~400 BC",
        change: "Illness has natural causes: an imbalance of four body fluids (blood, phlegm, yellow bile and black bile)",
        better: "Bloodletting, purging and special diets to rebalance the fluids, which often did more harm than good",
      },
      {
        icon: "🌫️",
        name: "Bad air",
        when: "Middle Ages to 1800s",
        change: "Diseases like cholera spread through foul-smelling air, called \u201cmiasma\u201d",
        better: "Cleaned up streets and built sewers, which really did cut disease, even though the reason was wrong",
      },
      {
        icon: "🚰",
        name: "Dirty water",
        when: "1854",
        change: "Cholera spreads through drinking water contaminated with sewage",
        better: "John Snow had the handle taken off a London water pump at the center of an outbreak, and cities began cleaning their water supplies",
      },
      {
        icon: "🦠",
        name: "Germs",
        when: "1860s to 1880s",
        change: "Tiny living organisms cause disease, and each disease has its own germ",
        better: "Surgeons cleaned their hands and instruments, and the first lab-made vaccines protected against diseases like rabies",
      },
      {
        icon: "💊",
        name: "Antibiotics",
        when: "1928 to 1940s",
        change: "Some molds make chemicals, like penicillin, that kill bacteria without harming people",
        better: "Mass-produced penicillin, curing infections that used to be deadly",
      },
      {
        icon: "🧬",
        name: "Genes and DNA",
        when: "1953 to today",
        change: "Genes, written in DNA, are the instructions for building our bodies, and viruses carry genes of their own",
        better: "Test for inherited diseases, and design vaccines straight from a virus's genes, like the COVID vaccines in 2020",
      },
    ],
  },
  {
    id: "english",
    label: "English",
    startLabel: "What people said: ",
    changeLabel: "What people said: ",
    betterLabel: "What happened: ",
    changeIsQuote: true,
    stages: [
      {
        icon: "📜",
        name: "Old English",
        when: "~1000",
        change: "“Fæder ūre, þū þe eart on heofonum”",
        better: "This is the opening line of the Lord's Prayer. Nobody designed Old English: it drifted out of the languages of Germanic tribes, one speaker at a time",
      },
      {
        icon: "📜",
        name: "Middle English",
        when: "1389",
        change: "“Oure fadir that art in heuenes”",
        better: "Each generation shifted a few sounds and spellings, and words like “þū þe” gave way to “that”",
      },
      {
        icon: "📖",
        name: "Early Modern English",
        when: "1611",
        change: "“Our Father which art in heaven”",
        better: "Spellings settled down, helped along by the printing press",
      },
      {
        icon: "💬",
        name: "Modern English",
        when: "Today",
        change: "“Our Father in heaven”",
        better: "“Art” and “which” dropped out of everyday speech, so they dropped out here too",
      },
    ],
  },
];

const STORY_TABS = STORIES.map((s) => ({ id: s.id, label: s.label }));

export function BuiltStepByStep() {
  const [storyId, setStoryId] = useState<StoryId>("eye");
  const [stageIndex, setStageIndex] = useState(0);

  const story = STORIES.find((s) => s.id === storyId)!;
  const stage = story.stages[stageIndex];
  const isFirst = stageIndex === 0;
  const isLast = stageIndex === story.stages.length - 1;

  const changeStory = useCallback((id: StoryId) => {
    setStoryId(id);
    setStageIndex(0);
  }, []);

  const reset = useCallback(() => {
    setStoryId("eye");
    setStageIndex(0);
  }, []);

  return (
    <WidgetContainer
      title="Built One Small Step at a Time"
      description="Step through how some complex things came to exist"
      onReset={reset}
    >
      <WidgetTabs tabs={STORY_TABS} activeTab={storyId} onTabChange={changeStory} />

      {/* Timeline of stages: click any one to jump to it */}
      <div className="mb-4 flex items-center">
        {story.stages.map((s, i) => (
          <div key={i} className="flex flex-1 items-center last:flex-none">
            <button
              onClick={() => setStageIndex(i)}
              aria-label={s.name}
              title={s.name}
              className={`flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full border-2 text-lg transition-all hover:scale-110 hover:border-accent ${
                i === stageIndex
                  ? "scale-110 border-accent bg-accent/15"
                  : i < stageIndex
                    ? "border-accent/40 bg-surface"
                    : "border-border bg-surface opacity-60 hover:opacity-100"
              }`}
            >
              {s.icon}
            </button>
            {i < story.stages.length - 1 && (
              <div
                className={`h-0.5 flex-1 transition-colors ${
                  i < stageIndex ? "bg-accent/40" : "bg-border"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* The selected stage */}
      <div className="min-h-[9.5rem] rounded-lg border border-border bg-surface/50 px-4 py-3 text-sm">
        <div className="mb-2 flex items-baseline justify-between gap-3">
          <span className="font-semibold text-foreground">
            {stageIndex + 1}. {stage.name}
          </span>
          <span className="shrink-0 font-mono text-xs text-muted">{stage.when}</span>
        </div>
        <div className="space-y-1.5">
          <div>
            <span className="font-semibold text-foreground">
              {isFirst ? story.startLabel : story.changeLabel}
            </span>
            <span className={story.changeIsQuote ? "italic text-foreground" : "text-muted"}>
              {stage.change}
            </span>
          </div>
          <div>
            <span className="font-semibold text-foreground">
              {story.betterLabel}
            </span>
            <span className="text-muted">{stage.better}</span>
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-2">
        <button
          onClick={() => setStageIndex((i) => i - 1)}
          disabled={isFirst}
          className="rounded-md bg-surface px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:text-foreground disabled:opacity-40 disabled:hover:text-muted"
        >
          ← Back
        </button>
        <span className="text-xs text-muted">
          Step {stageIndex + 1} of {story.stages.length}
        </span>
        <button
          onClick={() => setStageIndex((i) => i + 1)}
          disabled={isLast}
          className="rounded-md bg-accent px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          Next small change →
        </button>
      </div>
    </WidgetContainer>
  );
}
