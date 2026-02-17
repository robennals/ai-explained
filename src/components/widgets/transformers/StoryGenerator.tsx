"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { WidgetContainer } from "../shared/WidgetContainer";
import { SliderControl } from "../shared/SliderControl";

const PROMPTS = [
  "Once upon a time",
  "The little robot",
  "In a magical forest",
];

const STORIES: Record<string, Record<string, string[]>> = {
  "Once upon a time": {
    low: ["there", "was", "a", "little", "girl", "named", "Lily.", "She", "lived", "in", "a", "small", "house", "with", "her", "mom", "and", "dad.", "One", "day,", "Lily", "went", "to", "the", "park.", "She", "saw", "a", "big", "red", "ball.", "She", "picked", "it", "up", "and", "played", "with", "it.", "She", "was", "very", "happy."],
    medium: ["there", "was", "a", "curious", "fox", "named", "Rusty.", "He", "loved", "to", "explore", "the", "meadow", "near", "his", "den.", "One", "morning,", "he", "found", "a", "sparkling", "stone", "by", "the", "river.", "It", "glowed", "softly", "in", "the", "sunlight.", "Rusty", "carried", "it", "home", "and", "showed", "his", "friends.", "They", "were", "amazed!"],
    high: ["there", "was", "a", "dancing", "teapot", "named", "Professor", "Bubbles.", "Every", "Tuesday,", "he", "would", "fly", "over", "the", "rainbow", "mountains", "searching", "for", "lost", "socks.", "The", "clouds", "whispered", "secrets", "about", "invisible", "sandwiches.", "A", "penguin", "librarian", "joined", "his", "quest.", "Together,", "they", "discovered", "that", "the", "moon", "was", "actually", "made", "of", "cheese!"],
  },
  "The little robot": {
    low: ["was", "very", "small.", "He", "lived", "in", "a", "big", "house.", "He", "liked", "to", "help", "his", "friend.", "One", "day,", "he", "went", "to", "the", "store.", "He", "bought", "some", "food.", "He", "came", "home", "and", "made", "dinner.", "His", "friend", "was", "happy.", "They", "ate", "together.", "It", "was", "a", "good", "day."],
    medium: ["blinked", "its", "tiny", "blue", "eyes.", "It", "had", "been", "built", "by", "a", "kind", "inventor", "named", "Maya.", "Every", "morning,", "the", "robot", "would", "water", "the", "garden", "and", "sing", "a", "cheerful", "song.", "The", "flowers", "seemed", "to", "grow", "taller", "whenever", "it", "sang.", "Maya", "smiled", "and", "called", "it", "her", "best", "creation."],
    high: ["decided", "to", "become", "a", "pirate.", "It", "built", "a", "ship", "from", "cardboard", "and", "dreams.", "The", "ocean", "was", "actually", "a", "puddle,", "but", "the", "robot", "didn't", "mind.", "Fish", "made", "of", "origami", "swam", "alongside.", "A", "thunderstorm", "of", "confetti", "erupted!", "The", "robot", "declared", "itself", "emperor", "of", "all", "rubber", "ducks."],
  },
  "In a magical forest": {
    low: ["there", "lived", "a", "little", "bunny.", "The", "bunny", "was", "soft", "and", "white.", "She", "liked", "to", "hop", "around", "the", "trees.", "One", "day,", "she", "found", "a", "pretty", "flower.", "She", "picked", "it", "up", "and", "took", "it", "home.", "Her", "mom", "liked", "the", "flower.", "They", "put", "it", "in", "a", "vase."],
    medium: ["the", "trees", "whispered", "ancient", "stories.", "A", "young", "deer", "named", "Hazel", "listened", "carefully.", "The", "oldest", "oak", "told", "her", "about", "a", "hidden", "waterfall", "deep", "in", "the", "woods.", "Hazel", "decided", "to", "find", "it.", "She", "walked", "through", "ferns", "and", "moss", "until", "she", "heard", "the", "sound", "of", "rushing", "water."],
    high: ["the", "mushrooms", "held", "parliament", "every", "Wednesday.", "A", "confused", "wizard", "accidentally", "turned", "gravity", "sideways.", "Squirrels", "filed", "tax", "returns", "using", "acorn", "calculators.", "The", "river", "flowed", "upward", "into", "a", "sky", "made", "of", "marmalade.", "Nobody", "questioned", "why", "the", "butterflies", "wore", "tiny", "top", "hats.", "It", "was", "perfectly", "normal."],
  },
};

function getTemperatureKey(temp: number): string {
  if (temp <= 0.6) return "low";
  if (temp <= 1.3) return "medium";
  return "high";
}

export function StoryGenerator() {
  const [prompt, setPrompt] = useState(PROMPTS[0]);
  const [temperature, setTemperature] = useState(0.5);
  const [generatedWords, setGeneratedWords] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const stopRef = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const tempKey = getTemperatureKey(temperature);

  const cleanup = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  const handleGenerate = useCallback(() => {
    stopRef.current = false;
    setGeneratedWords([]);
    setIsGenerating(true);
    setIsDone(false);

    const words = STORIES[prompt]?.[getTemperatureKey(temperature)] || [];
    let index = 0;

    intervalRef.current = setInterval(() => {
      if (stopRef.current || index >= words.length) {
        cleanup();
        setIsGenerating(false);
        if (!stopRef.current) {
          setIsDone(true);
        }
        return;
      }
      setGeneratedWords((prev) => [...prev, words[index]]);
      index++;
    }, 150);
  }, [prompt, temperature, cleanup]);

  const handleStop = useCallback(() => {
    stopRef.current = true;
    cleanup();
    setIsGenerating(false);
  }, [cleanup]);

  const handleReset = useCallback(() => {
    stopRef.current = true;
    cleanup();
    setPrompt(PROMPTS[0]);
    setTemperature(0.5);
    setGeneratedWords([]);
    setIsGenerating(false);
    setIsDone(false);
  }, [cleanup]);

  const handlePromptChange = useCallback(
    (p: string) => {
      stopRef.current = true;
      cleanup();
      setPrompt(p);
      setGeneratedWords([]);
      setIsGenerating(false);
      setIsDone(false);
    },
    [cleanup],
  );

  return (
    <WidgetContainer
      title="Story Generator"
      description="Watch auto-regressive generation with temperature control"
      onReset={handleReset}
    >
      {/* Prompt selector */}
      <div className="mb-4 flex flex-wrap gap-2">
        {PROMPTS.map((p) => (
          <button
            key={p}
            onClick={() => handlePromptChange(p)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              prompt === p
                ? "bg-accent text-white"
                : "bg-surface text-muted hover:text-foreground"
            }`}
          >
            &ldquo;{p}&rdquo;
          </button>
        ))}
      </div>

      {/* Temperature slider */}
      <div className="mb-2">
        <SliderControl
          label="Temperature"
          value={temperature}
          min={0}
          max={2}
          step={0.1}
          onChange={setTemperature}
          formatValue={(v) => v.toFixed(1)}
        />
      </div>
      <div className="mb-4 flex justify-between px-1 text-[10px] text-muted">
        <span>Safe &amp; predictable</span>
        <span>Creative &amp; wild</span>
      </div>

      {/* Generate / Stop buttons */}
      <div className="mb-4 flex gap-2">
        {!isGenerating ? (
          <button
            onClick={handleGenerate}
            className="rounded-md bg-accent px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-accent/90"
          >
            {isDone ? "Generate Again" : "Generate"}
          </button>
        ) : (
          <button
            onClick={handleStop}
            className="rounded-md bg-red-500 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-red-600"
          >
            Stop
          </button>
        )}
      </div>

      {/* Story display */}
      <div className="min-h-[120px] rounded-lg border border-border bg-surface p-4">
        <span className="text-sm font-bold text-foreground">{prompt} </span>
        <span className="text-sm text-foreground">
          {generatedWords.join(" ")}
        </span>
        {isGenerating && (
          <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-accent" />
        )}
      </div>

      {/* Post-generation info */}
      {isDone && (
        <div className="mt-3 space-y-2">
          <div className="rounded-md border border-border bg-surface/50 px-3 py-2 text-xs text-muted">
            Temperature {temperature.toFixed(1)} gives{" "}
            {tempKey === "low"
              ? "the same predictable story every time"
              : tempKey === "medium"
                ? "a balanced mix of coherence and creativity"
                : "wild, unpredictable text"}
            . Temperature 0 always gives the same story. Higher temperature = more
            randomness = more creative (or more nonsensical).
          </div>
          <div className="text-[10px] text-muted">
            This is exactly how ChatGPT and Claude generate text &mdash; the same
            architecture, much bigger.
          </div>
        </div>
      )}
    </WidgetContainer>
  );
}
