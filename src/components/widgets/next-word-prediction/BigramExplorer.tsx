"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { WidgetContainer } from "../shared/WidgetContainer";
import { WidgetTabs } from "../shared/WidgetTabs";
import { SliderControl } from "../shared/SliderControl";

// Fully closed bigram dictionary: every word that appears as a prediction
// also has its own entry, so chains never hit dead ends.
// Frequencies are approximate, based on English text corpora.
const BIGRAM_DATA: Record<string, { word: string; pct: number }[]> = {
  the: [
    { word: "first", pct: 2.1 },
    { word: "same", pct: 1.5 },
    { word: "most", pct: 1.3 },
    { word: "other", pct: 1.1 },
    { word: "old", pct: 0.9 },
  ],
  of: [
    { word: "the", pct: 33.0 },
    { word: "a", pct: 4.2 },
    { word: "his", pct: 1.8 },
    { word: "this", pct: 1.5 },
    { word: "it", pct: 1.2 },
  ],
  and: [
    { word: "the", pct: 7.8 },
    { word: "a", pct: 2.1 },
    { word: "I", pct: 1.5 },
    { word: "it", pct: 1.3 },
    { word: "he", pct: 1.2 },
  ],
  to: [
    { word: "the", pct: 8.9 },
    { word: "be", pct: 5.4 },
    { word: "a", pct: 2.3 },
    { word: "do", pct: 1.8 },
    { word: "have", pct: 1.5 },
  ],
  a: [
    { word: "little", pct: 2.5 },
    { word: "new", pct: 2.1 },
    { word: "good", pct: 1.8 },
    { word: "great", pct: 1.3 },
    { word: "big", pct: 1.1 },
  ],
  in: [
    { word: "the", pct: 18.5 },
    { word: "a", pct: 3.8 },
    { word: "this", pct: 1.9 },
    { word: "his", pct: 1.2 },
    { word: "it", pct: 0.9 },
  ],
  is: [
    { word: "a", pct: 5.8 },
    { word: "the", pct: 4.2 },
    { word: "not", pct: 3.5 },
    { word: "that", pct: 2.1 },
    { word: "it", pct: 1.8 },
  ],
  it: [
    { word: "was", pct: 10.5 },
    { word: "is", pct: 9.8 },
    { word: "would", pct: 2.1 },
    { word: "had", pct: 1.8 },
    { word: "will", pct: 1.5 },
  ],
  that: [
    { word: "the", pct: 8.1 },
    { word: "he", pct: 4.5 },
    { word: "it", pct: 3.2 },
    { word: "she", pct: 2.8 },
    { word: "I", pct: 2.1 },
  ],
  was: [
    { word: "a", pct: 5.5 },
    { word: "the", pct: 3.8 },
    { word: "not", pct: 3.2 },
    { word: "very", pct: 1.5 },
    { word: "in", pct: 1.2 },
  ],
  I: [
    { word: "was", pct: 5.2 },
    { word: "have", pct: 4.8 },
    { word: "am", pct: 3.1 },
    { word: "had", pct: 2.7 },
    { word: "think", pct: 2.3 },
  ],
  he: [
    { word: "was", pct: 11.2 },
    { word: "had", pct: 7.5 },
    { word: "said", pct: 4.8 },
    { word: "is", pct: 3.2 },
    { word: "would", pct: 2.1 },
  ],
  she: [
    { word: "was", pct: 12.1 },
    { word: "had", pct: 8.3 },
    { word: "said", pct: 5.1 },
    { word: "is", pct: 2.9 },
    { word: "would", pct: 2.5 },
  ],
  they: [
    { word: "were", pct: 9.8 },
    { word: "are", pct: 6.2 },
    { word: "had", pct: 5.1 },
    { word: "have", pct: 4.3 },
    { word: "would", pct: 2.1 },
  ],
  we: [
    { word: "are", pct: 6.5 },
    { word: "have", pct: 5.8 },
    { word: "were", pct: 3.2 },
    { word: "can", pct: 2.8 },
    { word: "would", pct: 2.1 },
  ],
  you: [
    { word: "can", pct: 5.1 },
    { word: "are", pct: 4.2 },
    { word: "have", pct: 3.8 },
    { word: "know", pct: 2.9 },
    { word: "want", pct: 2.5 },
  ],
  his: [
    { word: "own", pct: 4.5 },
    { word: "head", pct: 2.1 },
    { word: "hand", pct: 1.8 },
    { word: "eyes", pct: 1.5 },
    { word: "life", pct: 1.2 },
  ],
  her: [
    { word: "own", pct: 3.8 },
    { word: "hand", pct: 2.2 },
    { word: "eyes", pct: 1.9 },
    { word: "head", pct: 1.6 },
    { word: "mother", pct: 1.3 },
  ],
  not: [
    { word: "a", pct: 4.2 },
    { word: "the", pct: 3.1 },
    { word: "be", pct: 2.8 },
    { word: "have", pct: 2.1 },
    { word: "only", pct: 1.9 },
  ],
  had: [
    { word: "been", pct: 12.8 },
    { word: "a", pct: 5.1 },
    { word: "no", pct: 2.8 },
    { word: "not", pct: 2.5 },
    { word: "the", pct: 2.1 },
  ],
  have: [
    { word: "been", pct: 10.5 },
    { word: "a", pct: 5.8 },
    { word: "to", pct: 4.2 },
    { word: "the", pct: 2.1 },
    { word: "no", pct: 1.8 },
  ],
  would: [
    { word: "be", pct: 12.5 },
    { word: "have", pct: 8.1 },
    { word: "not", pct: 5.2 },
    { word: "you", pct: 2.1 },
    { word: "like", pct: 1.8 },
  ],
  said: [
    { word: "the", pct: 5.5 },
    { word: "he", pct: 3.8 },
    { word: "she", pct: 3.2 },
    { word: "that", pct: 2.5 },
    { word: "I", pct: 2.1 },
  ],
  were: [
    { word: "not", pct: 4.5 },
    { word: "the", pct: 2.8 },
    { word: "in", pct: 2.1 },
    { word: "all", pct: 1.8 },
    { word: "very", pct: 1.5 },
  ],
  are: [
    { word: "not", pct: 4.8 },
    { word: "the", pct: 3.1 },
    { word: "you", pct: 2.5 },
    { word: "a", pct: 2.1 },
    { word: "very", pct: 1.8 },
  ],
  can: [
    { word: "be", pct: 8.5 },
    { word: "you", pct: 3.2 },
    { word: "we", pct: 2.1 },
    { word: "I", pct: 1.8 },
    { word: "the", pct: 1.5 },
  ],
  been: [
    { word: "a", pct: 5.2 },
    { word: "the", pct: 3.1 },
    { word: "in", pct: 2.8 },
    { word: "very", pct: 1.5 },
    { word: "so", pct: 1.2 },
  ],
  be: [
    { word: "a", pct: 5.1 },
    { word: "the", pct: 3.8 },
    { word: "in", pct: 2.1 },
    { word: "very", pct: 1.5 },
    { word: "so", pct: 1.2 },
  ],
  do: [
    { word: "not", pct: 12.5 },
    { word: "you", pct: 8.1 },
    { word: "it", pct: 5.2 },
    { word: "the", pct: 2.1 },
    { word: "we", pct: 1.8 },
  ],
  will: [
    { word: "be", pct: 12.8 },
    { word: "have", pct: 4.5 },
    { word: "not", pct: 4.2 },
    { word: "you", pct: 2.1 },
    { word: "the", pct: 1.8 },
  ],
  this: [
    { word: "is", pct: 12.5 },
    { word: "was", pct: 5.1 },
    { word: "time", pct: 2.1 },
    { word: "one", pct: 1.5 },
    { word: "the", pct: 1.2 },
  ],
  am: [
    { word: "not", pct: 8.5 },
    { word: "a", pct: 5.1 },
    { word: "I", pct: 3.2 },
    { word: "very", pct: 2.1 },
    { word: "so", pct: 1.8 },
  ],
  no: [
    { word: "one", pct: 8.5 },
    { word: "longer", pct: 3.2 },
    { word: "more", pct: 2.8 },
    { word: "matter", pct: 2.1 },
    { word: "doubt", pct: 1.5 },
  ],
  think: [
    { word: "of", pct: 8.5 },
    { word: "that", pct: 7.1 },
    { word: "about", pct: 5.2 },
    { word: "it", pct: 3.8 },
    { word: "I", pct: 2.1 },
  ],
  know: [
    { word: "that", pct: 10.5 },
    { word: "what", pct: 5.2 },
    { word: "how", pct: 4.1 },
    { word: "the", pct: 2.8 },
    { word: "it", pct: 2.1 },
  ],
  want: [
    { word: "to", pct: 35.0 },
    { word: "a", pct: 3.1 },
    { word: "the", pct: 2.5 },
    { word: "it", pct: 2.1 },
    { word: "you", pct: 1.8 },
  ],
  like: [
    { word: "a", pct: 8.5 },
    { word: "the", pct: 5.1 },
    { word: "that", pct: 3.2 },
    { word: "it", pct: 2.8 },
    { word: "to", pct: 2.1 },
  ],
  about: [
    { word: "the", pct: 12.5 },
    { word: "it", pct: 5.8 },
    { word: "a", pct: 3.2 },
    { word: "his", pct: 2.1 },
    { word: "her", pct: 1.8 },
  ],
  what: [
    { word: "he", pct: 5.5 },
    { word: "I", pct: 4.8 },
    { word: "is", pct: 4.2 },
    { word: "the", pct: 3.1 },
    { word: "she", pct: 2.8 },
  ],
  how: [
    { word: "to", pct: 12.5 },
    { word: "the", pct: 3.8 },
    { word: "it", pct: 3.1 },
    { word: "I", pct: 2.5 },
    { word: "he", pct: 2.1 },
  ],
  so: [
    { word: "that", pct: 5.8 },
    { word: "I", pct: 3.5 },
    { word: "he", pct: 2.8 },
    { word: "the", pct: 2.1 },
    { word: "she", pct: 1.8 },
  ],
  very: [
    { word: "good", pct: 3.5 },
    { word: "much", pct: 3.2 },
    { word: "well", pct: 2.1 },
    { word: "little", pct: 1.8 },
    { word: "old", pct: 1.5 },
  ],
  all: [
    { word: "the", pct: 15.5 },
    { word: "of", pct: 5.2 },
    { word: "his", pct: 2.1 },
    { word: "over", pct: 1.8 },
    { word: "her", pct: 1.5 },
  ],
  over: [
    { word: "the", pct: 12.5 },
    { word: "his", pct: 2.8 },
    { word: "her", pct: 2.1 },
    { word: "a", pct: 1.8 },
    { word: "and", pct: 1.5 },
  ],
  one: [
    { word: "of", pct: 15.5 },
    { word: "day", pct: 3.2 },
    { word: "who", pct: 2.1 },
    { word: "and", pct: 1.8 },
    { word: "could", pct: 1.5 },
  ],
  first: [
    { word: "time", pct: 8.5 },
    { word: "to", pct: 3.2 },
    { word: "of", pct: 2.8 },
    { word: "the", pct: 2.1 },
    { word: "and", pct: 1.5 },
  ],
  same: [
    { word: "time", pct: 12.5 },
    { word: "thing", pct: 5.8 },
    { word: "way", pct: 4.2 },
    { word: "as", pct: 2.1 },
    { word: "old", pct: 1.5 },
  ],
  most: [
    { word: "of", pct: 10.5 },
    { word: "important", pct: 3.2 },
    { word: "people", pct: 2.1 },
    { word: "the", pct: 1.8 },
    { word: "likely", pct: 1.5 },
  ],
  other: [
    { word: "side", pct: 3.5 },
    { word: "hand", pct: 3.2 },
    { word: "people", pct: 2.8 },
    { word: "things", pct: 2.1 },
    { word: "than", pct: 1.8 },
  ],
  old: [
    { word: "man", pct: 8.5 },
    { word: "woman", pct: 3.2 },
    { word: "friend", pct: 2.1 },
    { word: "and", pct: 1.8 },
    { word: "house", pct: 1.5 },
  ],
  little: [
    { word: "girl", pct: 5.2 },
    { word: "boy", pct: 4.1 },
    { word: "more", pct: 3.5 },
    { word: "bit", pct: 2.8 },
    { word: "one", pct: 2.1 },
  ],
  new: [
    { word: "one", pct: 3.5 },
    { word: "and", pct: 2.1 },
    { word: "life", pct: 1.8 },
    { word: "world", pct: 1.5 },
    { word: "way", pct: 1.2 },
  ],
  good: [
    { word: "and", pct: 3.5 },
    { word: "for", pct: 2.8 },
    { word: "to", pct: 2.1 },
    { word: "at", pct: 1.8 },
    { word: "thing", pct: 1.5 },
  ],
  great: [
    { word: "deal", pct: 5.5 },
    { word: "and", pct: 2.1 },
    { word: "many", pct: 1.8 },
    { word: "thing", pct: 1.5 },
    { word: "big", pct: 1.2 },
  ],
  big: [
    { word: "and", pct: 3.5 },
    { word: "one", pct: 2.1 },
    { word: "old", pct: 1.8 },
    { word: "thing", pct: 1.5 },
    { word: "deal", pct: 1.2 },
  ],
  only: [
    { word: "a", pct: 5.5 },
    { word: "the", pct: 4.8 },
    { word: "one", pct: 3.2 },
    { word: "to", pct: 2.1 },
    { word: "thing", pct: 1.5 },
  ],
  own: [
    { word: "and", pct: 3.5 },
    { word: "way", pct: 2.8 },
    { word: "life", pct: 2.1 },
    { word: "the", pct: 1.8 },
    { word: "hand", pct: 1.5 },
  ],
  could: [
    { word: "not", pct: 15.5 },
    { word: "be", pct: 8.1 },
    { word: "have", pct: 5.2 },
    { word: "see", pct: 2.8 },
    { word: "do", pct: 2.1 },
  ],
  see: [
    { word: "the", pct: 8.5 },
    { word: "that", pct: 5.2 },
    { word: "it", pct: 3.8 },
    { word: "a", pct: 3.1 },
    { word: "what", pct: 2.5 },
  ],
  who: [
    { word: "had", pct: 8.5 },
    { word: "was", pct: 7.1 },
    { word: "is", pct: 3.8 },
    { word: "would", pct: 2.5 },
    { word: "are", pct: 2.1 },
  ],
  than: [
    { word: "the", pct: 8.5 },
    { word: "a", pct: 5.2 },
    { word: "he", pct: 3.1 },
    { word: "I", pct: 2.5 },
    { word: "it", pct: 2.1 },
  ],
  as: [
    { word: "a", pct: 8.5 },
    { word: "the", pct: 5.8 },
    { word: "he", pct: 3.2 },
    { word: "if", pct: 2.8 },
    { word: "I", pct: 2.1 },
  ],
  if: [
    { word: "you", pct: 10.5 },
    { word: "I", pct: 8.1 },
    { word: "he", pct: 5.2 },
    { word: "the", pct: 3.1 },
    { word: "it", pct: 2.8 },
  ],
  for: [
    { word: "the", pct: 12.5 },
    { word: "a", pct: 5.8 },
    { word: "his", pct: 2.1 },
    { word: "her", pct: 1.8 },
    { word: "it", pct: 1.5 },
  ],
  at: [
    { word: "the", pct: 15.5 },
    { word: "a", pct: 3.8 },
    { word: "his", pct: 2.1 },
    { word: "her", pct: 1.8 },
    { word: "all", pct: 1.5 },
  ],
  time: [
    { word: "to", pct: 5.5 },
    { word: "and", pct: 3.2 },
    { word: "he", pct: 2.1 },
    { word: "the", pct: 1.8 },
    { word: "I", pct: 1.5 },
  ],
  day: [
    { word: "and", pct: 3.5 },
    { word: "the", pct: 2.8 },
    { word: "he", pct: 2.1 },
    { word: "I", pct: 1.8 },
    { word: "she", pct: 1.5 },
  ],
  much: [
    { word: "of", pct: 5.5 },
    { word: "more", pct: 3.8 },
    { word: "as", pct: 3.2 },
    { word: "to", pct: 2.1 },
    { word: "the", pct: 1.8 },
  ],
  well: [
    { word: "as", pct: 8.5 },
    { word: "and", pct: 3.2 },
    { word: "I", pct: 2.1 },
    { word: "the", pct: 1.8 },
    { word: "he", pct: 1.5 },
  ],
  more: [
    { word: "than", pct: 12.5 },
    { word: "and", pct: 3.2 },
    { word: "of", pct: 2.8 },
    { word: "or", pct: 2.1 },
    { word: "about", pct: 1.8 },
  ],
  or: [
    { word: "the", pct: 5.5 },
    { word: "a", pct: 4.2 },
    { word: "not", pct: 3.1 },
    { word: "two", pct: 2.1 },
    { word: "she", pct: 1.8 },
  ],
  two: [
    { word: "of", pct: 5.5 },
    { word: "or", pct: 3.2 },
    { word: "and", pct: 2.8 },
    { word: "days", pct: 2.1 },
    { word: "years", pct: 1.8 },
  ],
  // Extra words that appear as predictions above
  longer: [
    { word: "a", pct: 5.2 },
    { word: "the", pct: 3.8 },
    { word: "and", pct: 2.1 },
    { word: "than", pct: 1.8 },
    { word: "in", pct: 1.5 },
  ],
  matter: [
    { word: "of", pct: 8.5 },
    { word: "what", pct: 5.2 },
    { word: "how", pct: 3.8 },
    { word: "is", pct: 2.1 },
    { word: "and", pct: 1.5 },
  ],
  doubt: [
    { word: "that", pct: 12.5 },
    { word: "the", pct: 5.2 },
    { word: "it", pct: 3.8 },
    { word: "about", pct: 2.1 },
    { word: "he", pct: 1.5 },
  ],
  important: [
    { word: "to", pct: 12.5 },
    { word: "thing", pct: 5.2 },
    { word: "and", pct: 2.8 },
    { word: "for", pct: 2.1 },
    { word: "that", pct: 1.8 },
  ],
  people: [
    { word: "who", pct: 8.5 },
    { word: "are", pct: 5.2 },
    { word: "in", pct: 3.1 },
    { word: "and", pct: 2.8 },
    { word: "have", pct: 2.1 },
  ],
  likely: [
    { word: "to", pct: 35.0 },
    { word: "that", pct: 5.2 },
    { word: "the", pct: 2.1 },
    { word: "a", pct: 1.8 },
    { word: "in", pct: 1.5 },
  ],
  side: [
    { word: "of", pct: 15.5 },
    { word: "and", pct: 3.2 },
    { word: "the", pct: 2.1 },
    { word: "by", pct: 1.8 },
    { word: "to", pct: 1.5 },
  ],
  hand: [
    { word: "and", pct: 5.5 },
    { word: "of", pct: 3.8 },
    { word: "in", pct: 2.8 },
    { word: "on", pct: 2.1 },
    { word: "the", pct: 1.5 },
  ],
  things: [
    { word: "that", pct: 5.5 },
    { word: "are", pct: 3.8 },
    { word: "in", pct: 2.1 },
    { word: "and", pct: 1.8 },
    { word: "to", pct: 1.5 },
  ],
  man: [
    { word: "who", pct: 8.5 },
    { word: "was", pct: 5.2 },
    { word: "and", pct: 3.1 },
    { word: "in", pct: 2.1 },
    { word: "of", pct: 1.8 },
  ],
  woman: [
    { word: "who", pct: 8.5 },
    { word: "was", pct: 5.2 },
    { word: "and", pct: 3.1 },
    { word: "in", pct: 2.1 },
    { word: "of", pct: 1.8 },
  ],
  friend: [
    { word: "and", pct: 5.5 },
    { word: "of", pct: 3.8 },
    { word: "who", pct: 2.8 },
    { word: "was", pct: 2.1 },
    { word: "had", pct: 1.5 },
  ],
  house: [
    { word: "and", pct: 5.5 },
    { word: "of", pct: 3.8 },
    { word: "was", pct: 2.8 },
    { word: "in", pct: 2.1 },
    { word: "the", pct: 1.5 },
  ],
  girl: [
    { word: "who", pct: 5.5 },
    { word: "was", pct: 4.8 },
    { word: "and", pct: 3.2 },
    { word: "in", pct: 2.1 },
    { word: "had", pct: 1.8 },
  ],
  boy: [
    { word: "who", pct: 5.5 },
    { word: "was", pct: 4.8 },
    { word: "and", pct: 3.2 },
    { word: "in", pct: 2.1 },
    { word: "had", pct: 1.8 },
  ],
  bit: [
    { word: "of", pct: 15.5 },
    { word: "more", pct: 3.8 },
    { word: "and", pct: 2.1 },
    { word: "like", pct: 1.8 },
    { word: "the", pct: 1.5 },
  ],
  life: [
    { word: "of", pct: 5.5 },
    { word: "and", pct: 3.8 },
    { word: "is", pct: 3.2 },
    { word: "in", pct: 2.1 },
    { word: "was", pct: 1.8 },
  ],
  way: [
    { word: "to", pct: 8.5 },
    { word: "of", pct: 5.2 },
    { word: "the", pct: 3.1 },
    { word: "he", pct: 2.1 },
    { word: "that", pct: 1.8 },
  ],
  world: [
    { word: "of", pct: 5.5 },
    { word: "and", pct: 3.8 },
    { word: "is", pct: 3.2 },
    { word: "was", pct: 2.1 },
    { word: "the", pct: 1.8 },
  ],
  thing: [
    { word: "to", pct: 8.5 },
    { word: "that", pct: 5.2 },
    { word: "is", pct: 3.8 },
    { word: "about", pct: 2.1 },
    { word: "in", pct: 1.8 },
  ],
  deal: [
    { word: "of", pct: 12.5 },
    { word: "with", pct: 8.5 },
    { word: "about", pct: 3.2 },
    { word: "and", pct: 2.1 },
    { word: "the", pct: 1.5 },
  ],
  many: [
    { word: "of", pct: 10.5 },
    { word: "people", pct: 5.2 },
    { word: "things", pct: 3.1 },
    { word: "years", pct: 2.8 },
    { word: "other", pct: 2.1 },
  ],
  on: [
    { word: "the", pct: 18.5 },
    { word: "a", pct: 3.8 },
    { word: "his", pct: 2.1 },
    { word: "her", pct: 1.8 },
    { word: "it", pct: 1.5 },
  ],
  with: [
    { word: "the", pct: 12.5 },
    { word: "a", pct: 5.8 },
    { word: "his", pct: 3.2 },
    { word: "her", pct: 2.8 },
    { word: "it", pct: 2.1 },
  ],
  by: [
    { word: "the", pct: 15.5 },
    { word: "a", pct: 5.2 },
    { word: "his", pct: 2.1 },
    { word: "her", pct: 1.8 },
    { word: "no", pct: 1.5 },
  ],
  head: [
    { word: "and", pct: 5.5 },
    { word: "of", pct: 3.8 },
    { word: "to", pct: 2.8 },
    { word: "was", pct: 2.1 },
    { word: "in", pct: 1.5 },
  ],
  eyes: [
    { word: "and", pct: 5.5 },
    { word: "of", pct: 3.8 },
    { word: "were", pct: 3.2 },
    { word: "to", pct: 2.1 },
    { word: "on", pct: 1.5 },
  ],
  mother: [
    { word: "and", pct: 5.5 },
    { word: "was", pct: 4.8 },
    { word: "had", pct: 3.2 },
    { word: "of", pct: 2.1 },
    { word: "who", pct: 1.8 },
  ],
  days: [
    { word: "of", pct: 5.5 },
    { word: "and", pct: 3.8 },
    { word: "the", pct: 2.8 },
    { word: "ago", pct: 2.1 },
    { word: "later", pct: 1.8 },
  ],
  years: [
    { word: "ago", pct: 8.5 },
    { word: "of", pct: 5.2 },
    { word: "old", pct: 3.8 },
    { word: "and", pct: 2.1 },
    { word: "the", pct: 1.8 },
  ],
  ago: [
    { word: "and", pct: 5.5 },
    { word: "the", pct: 3.8 },
    { word: "I", pct: 2.8 },
    { word: "he", pct: 2.1 },
    { word: "she", pct: 1.8 },
  ],
  later: [
    { word: "he", pct: 5.5 },
    { word: "the", pct: 3.8 },
    { word: "she", pct: 3.2 },
    { word: "I", pct: 2.1 },
    { word: "in", pct: 1.8 },
  ],
};

const AVAILABLE_WORDS = Object.keys(BIGRAM_DATA);

function temperatureSample(
  items: { word: string; pct: number }[],
  temperature: number
): string {
  if (temperature < 0.05) {
    // Greedy: always pick the top word
    return items[0].word;
  }

  // Apply temperature: raise probabilities to 1/T, then renormalize
  const scaled = items.map((item) => ({
    word: item.word,
    weight: Math.pow(item.pct, 1 / temperature),
  }));
  const totalWeight = scaled.reduce((sum, s) => sum + s.weight, 0);
  let random = Math.random() * totalWeight;
  for (const s of scaled) {
    random -= s.weight;
    if (random <= 0) return s.word;
  }
  return scaled[scaled.length - 1].word;
}

type Mode = "explore" | "generate";

const BIGRAM_TABS: { id: Mode; label: string }[] = [
  { id: "explore", label: "Explore" },
  { id: "generate", label: "Generate" },
];

export function BigramExplorer() {
  const [mode, setMode] = useState<Mode>("explore");
  const [selectedWord, setSelectedWord] = useState("the");
  const [exploreSentence, setExploreSentence] = useState<string[]>(["the"]);
  const [startWord, setStartWord] = useState("the");
  const [temperature, setTemperature] = useState(1.0);
  const [generatedWords, setGeneratedWords] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const resetState = useCallback(() => {
    setMode("explore");
    setSelectedWord("the");
    setExploreSentence(["the"]);
    setStartWord("the");
    setTemperature(1.0);
    setGeneratedWords([]);
    setIsGenerating(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const bigramResults = BIGRAM_DATA[selectedWord] || null;
  const maxPct = bigramResults
    ? Math.max(...bigramResults.map((b) => b.pct))
    : 0;

  const handleGenerate = () => {
    if (isGenerating) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setIsGenerating(false);
      return;
    }

    const words = [startWord];
    setGeneratedWords(words);
    setIsGenerating(true);

    intervalRef.current = setInterval(() => {
      setGeneratedWords((prev) => {
        if (prev.length >= 30) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          setIsGenerating(false);
          return prev;
        }
        const lastWord = prev[prev.length - 1];
        const nextOptions = BIGRAM_DATA[lastWord];
        if (!nextOptions) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          setIsGenerating(false);
          return prev;
        }
        return [...prev, temperatureSample(nextOptions, temperature)];
      });
    }, 250);
  };

  const handleClear = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsGenerating(false);
    setGeneratedWords([]);
  };

  return (
    <WidgetContainer
      title="Bigram Explorer"
      description="Given the previous word, what comes next?"
      onReset={resetState}
    >
      {/* Mode tabs */}
      <WidgetTabs tabs={BIGRAM_TABS} activeTab={mode} onTabChange={setMode} />

      {mode === "explore" ? (
        <div className="space-y-4">
          <div className="text-xs text-muted">
            Pick a starting word, then click predictions to build a sentence one word at a time. Watch how the model only ever looks at the last word you picked.
          </div>

          {/* Starting word selector */}
          <div className="flex flex-wrap gap-1.5">
            {AVAILABLE_WORDS.slice(0, 30).map((w) => (
              <button
                key={w}
                onClick={() => {
                  setSelectedWord(w);
                  setExploreSentence([w]);
                }}
                className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                  selectedWord === w
                    ? "bg-accent text-white"
                    : "bg-surface text-muted hover:text-foreground"
                }`}
              >
                {w}
              </button>
            ))}
          </div>

          {/* Accumulated sentence */}
          {exploreSentence.length > 0 && (
            <div className="rounded-lg bg-surface px-4 py-3 font-mono text-sm leading-relaxed text-foreground">
              {exploreSentence.map((w, i) => (
                <span key={i}>
                  {i > 0 && " "}
                  <span
                    className={
                      i === exploreSentence.length - 1
                        ? "font-bold text-accent"
                        : "text-muted"
                    }
                  >
                    {w}
                  </span>
                </span>
              ))}
              <span className="ml-1 inline-block h-4 w-0.5 animate-pulse bg-accent" />
            </div>
          )}

          {bigramResults && (
            <div className="space-y-1.5">
              <div className="text-xs text-muted">
                The model only sees &ldquo;<span className="font-mono font-bold text-foreground">{selectedWord}</span>&rdquo; — click a prediction to add it:
              </div>
              {bigramResults.map((b) => (
                <button
                  key={b.word}
                  onClick={() => {
                    setSelectedWord(b.word);
                    setExploreSentence((prev) => [...prev, b.word]);
                  }}
                  className="flex w-full items-center gap-2 rounded-md px-1 py-0.5 transition-colors hover:bg-surface"
                >
                  <span className="w-20 text-right font-mono text-xs font-medium text-accent">
                    {b.word}
                  </span>
                  <div className="flex-1">
                    <div
                      className="h-5 rounded-sm bg-accent/70 transition-all duration-300"
                      style={{ width: `${(b.pct / maxPct) * 100}%` }}
                    />
                  </div>
                  <span className="w-12 text-right font-mono text-xs text-muted">
                    {b.pct}%
                  </span>
                </button>
              ))}
              {exploreSentence.length > 2 && (
                <div className="mt-2 text-xs text-muted">
                  {exploreSentence.length} words so far. Each pair makes sense, but read the whole thing — nonsense! The model forgets everything before the last word.
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-muted">Start with:</span>
            <select
              value={startWord}
              onChange={(e) => setStartWord(e.target.value)}
              className="rounded-md border border-border bg-white px-2.5 py-1.5 font-mono text-sm text-foreground outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent/30"
            >
              {AVAILABLE_WORDS.map((w) => (
                <option key={w} value={w}>
                  {w}
                </option>
              ))}
            </select>
          </div>

          <SliderControl
            label="Temperature"
            value={temperature}
            min={0}
            max={2}
            step={0.1}
            onChange={setTemperature}
            formatValue={(v) => v.toFixed(1)}
          />
          <div className="flex justify-between px-24 text-[10px] text-muted -mt-1">
            <span>Always pick top word</span>
            <span>Pick more randomly</span>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleGenerate}
              className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-dark"
            >
              {isGenerating ? "Stop" : "Generate"}
            </button>
            <button
              onClick={handleClear}
              className="rounded-md border border-border px-4 py-2 text-sm font-medium text-muted transition-colors hover:text-foreground"
            >
              Clear
            </button>
          </div>

          {generatedWords.length > 0 && (
            <>
              <div className="min-h-[60px] rounded-lg bg-surface px-4 py-3 font-mono text-sm leading-relaxed text-foreground">
                {generatedWords.join(" ")}
                {isGenerating && (
                  <span className="ml-1 inline-block h-4 w-0.5 animate-pulse bg-accent" />
                )}
              </div>
              <div className="text-xs text-muted">
                {generatedWords.length} words generated.
                {" "}Each pair of words makes sense, but the overall text is nonsense — the model can only see one word at a time.
              </div>
            </>
          )}
        </div>
      )}
    </WidgetContainer>
  );
}
