"use client";

import { useState, useCallback } from "react";
import { WidgetContainer } from "../shared/WidgetContainer";

/* ------------------------------------------------------------------ */
/*  Real BERT attention data (pre-computed from bert-base-uncased)     */
/* ------------------------------------------------------------------ */

interface HeadData {
  label: string;
  attention: number[][];
}

interface SentenceData {
  words: string[];
  heads: HeadData[];
  /** What the reader should look for in this sentence */
  guide: string;
  /** Per-head hints for this sentence */
  headGuides: Record<string, string>;
}

const SENTENCES: SentenceData[] = [
  {
    words: ["The","dog","chased","the","cat","because","it","was","angry"],
    guide: 'Click "it" — the pronoun head splits attention between "dog" (34%) and "cat" (30%), trying to figure out which noun the pronoun refers to.',
    headGuides: {
      "Next word": "Every word attends almost 100% to the word that follows it — a simple forward chain.",
      "Previous word": "The mirror image — each word looks back at the one before it.",
      "Self / pronoun": 'Most words attend to themselves. But click "it" — it splits between "dog" (34%) and "cat" (30%), trying to resolve the pronoun.',
      "Broad context": 'Click "it" — it attends to "because" (98%), connecting the pronoun to the causal structure.',
    },
    heads: [
      {label:"Next word",attention:[[0,1,0,0,0,0,0,0,0],[0,0,1,0,0,0,0,0,0],[0,0,0,1,0,0,0,0,0],[0,0,0,0,1,0,0,0,0],[0,0,0,0,0,1,0,0,0],[0,0,0,0,0,0,1,0,0],[0,0,0,0,0,0,0,1,0],[0,0,0,0,0,0,0,0,1],[0,0,0,0,.008,0,.796,.137,.057]]},
      {label:"Previous word",attention:[[.898,.012,.018,.001,.002,.003,0,0,.066],[.971,.009,.009,.006,0,.005,0,0,0],[.049,.803,.117,.018,.008,.002,.002,.002,0],[0,.002,.996,.001,0,0,0,0,0],[.001,.001,.256,.72,.006,.012,0,0,.002],[.001,.001,.005,.008,.938,.043,.003,.001,.001],[0,0,.001,0,.011,.962,.002,0,.023],[0,0,0,0,.002,.009,.986,.002,.001],[0,.001,.001,.001,.001,.001,.01,.977,.009]]},
      {label:"Self / pronoun",attention:[[.431,.006,.001,.54,.008,.001,.007,.001,.005],[.001,.597,.001,.001,.394,0,.001,0,.004],[.001,.001,.972,0,.001,.002,0,.001,.022],[.371,.012,.001,.608,.005,0,.001,0,.001],[0,.152,0,0,.848,0,0,0,0],[.004,.001,.015,.001,0,.968,0,.001,.01],[.162,.337,.018,.066,.296,0,.105,.014,.002],[.004,.005,.022,.003,.008,.001,.003,.95,.003],[.003,.004,.015,.001,.002,.007,.001,.001,.967]]},
      {label:"Broad context",attention:[[.703,.059,.074,.006,.006,.014,.001,0,.136],[.898,.054,.009,.031,.002,.001,0,0,.004],[.036,.844,.058,.025,.033,.002,.001,0,.002],[.014,.031,.807,.105,.018,.02,.001,0,.004],[.09,.014,.051,.801,.017,.022,.001,.001,.004],[.001,.008,.059,.014,.605,.285,.016,.008,.006],[.001,0,.004,.002,.002,.976,.005,.001,.01],[0,.006,.001,0,.01,.04,.931,.006,.005],[.009,.003,.002,.002,.006,.239,.236,.398,.106]]},
    ],
  },
  {
    words: ["The","movie","was","not","great","but","I","loved","it","anyway"],
    guide: 'Click "it" — it attends to "movie" (55%) across seven words. The model learned to link a pronoun back to the thing being talked about.',
    headGuides: {
      "Next word": "The standard forward chain. \"anyway\" (last word) attends mostly to itself — there's nothing after it.",
      "Previous word": '"loved" attends to "I" (79%) — gathering its subject. "not" attends to "was" (98%).',
      "Self / pronoun": '"it" attends to "movie" (55%) and "The" (15%) — pronoun resolution spanning 7 words.',
      "Broad context": '"but" attends to "great" (76%) — connecting the contrast word to what\'s being contrasted.',
    },
    heads: [
      {label:"Next word",attention:[[0,1,0,0,0,0,0,0,0,0],[0,0,1,0,0,0,0,0,0,0],[0,0,0,.998,.001,0,0,0,0,0],[0,0,0,0,1,0,0,0,0,0],[0,0,0,0,0,1,0,0,0,0],[0,0,0,0,0,0,1,0,0,0],[0,0,0,0,0,0,0,1,0,0],[0,0,0,0,0,0,0,0,1,0],[0,0,0,0,0,0,0,0,0,1],[0,0,0,0,0,.003,0,.002,.001,.994]]},
      {label:"Previous word",attention:[[.912,.038,.005,.001,.001,.003,.001,0,0,.038],[.939,.048,.01,.001,0,.001,0,0,0,0],[.132,.782,.068,.001,.008,.003,.005,0,0,0],[.001,.013,.982,.002,.001,.001,0,0,0,0],[.002,0,.028,.968,.001,.001,0,0,0,0],[.001,.003,.008,.002,.879,.097,.004,.001,.003,.001],[.003,0,.002,0,.001,.985,.003,.003,.001,.002],[.002,.003,.019,.011,.003,.097,.789,.067,.009,.001],[0,0,0,0,0,.002,0,.996,.001,.001],[0,0,0,0,.001,.002,.001,.203,.777,.016]]},
      {label:"Self / pronoun",attention:[[.883,.043,.002,0,0,.002,.001,.002,.061,.005],[.028,.932,.004,.001,0,.004,.004,.001,.019,.008],[.001,.001,.941,.044,0,.001,.001,.003,.001,.007],[0,0,.014,.97,.002,.001,.001,.007,.001,.004],[.002,.001,.002,.052,.895,.006,.006,.032,.001,.003],[0,0,.003,.038,.001,.937,.001,0,0,.02],[.019,.017,.031,.067,.016,.008,.821,.004,.004,.016],[.001,.001,.003,.029,.033,.001,0,.931,0,0],[.148,.548,.024,.018,.001,.001,0,.001,.257,.001],[.004,.015,.131,.234,.015,.244,.002,.003,.004,.348]]},
      {label:"Broad context",attention:[[.658,.183,.019,.003,.019,.008,.001,.005,.004,.101],[.963,.012,.01,.001,.01,.001,0,.001,.001,.001],[.025,.892,.067,.013,.004,0,0,0,0,0],[.005,.049,.819,.113,.014,0,0,0,0,0],[.009,.01,.063,.865,.038,.013,.001,.001,.001,0],[.001,.018,.022,.006,.762,.179,.006,.001,.006,0],[.004,.006,.003,.007,.02,.932,.006,.014,.008,.002],[0,.001,.001,.003,.001,.008,.971,.011,.003,.001],[.001,.001,0,0,.006,.008,.001,.879,.096,.008],[.001,.002,0,0,.006,0,.006,.034,.907,.044]]},
    ],
  },
  {
    words: ["The","teacher","praised","the","student","because","she","was","proud"],
    guide: 'Click "she" — it attends to "teacher" (37%) and "student" (11%), weighing which person the pronoun refers to.',
    headGuides: {
      "Next word": "The standard forward chain — each word passes information to its neighbor.",
      "Previous word": '"she" attends to "because" (97%) — the word right before it.',
      "Self / pronoun": '"she" splits between "teacher" (37%) and "student" (11%) — pronoun resolution with two candidates. Who was proud?',
      "Broad context": '"she" attends to "because" (97%) — connecting to the causal structure.',
    },
    heads: [
      {label:"Next word",attention:[[0,1,0,0,0,0,0,0,0],[0,0,1,0,0,0,0,0,0],[0,0,0,1,0,0,0,0,0],[0,0,0,0,1,0,0,0,0],[0,0,0,0,0,1,0,0,0],[0,0,0,0,0,0,1,0,0],[0,0,0,0,0,0,0,1,0],[0,0,0,0,0,0,0,0,1],[.003,0,0,.009,.017,.001,.635,.102,.234]]},
      {label:"Previous word",attention:[[.882,.033,.049,.001,.001,.002,0,0,.033],[.975,.006,.015,.002,0,.001,0,0,0],[.085,.71,.191,.004,.001,.003,.006,.001,0],[0,.003,.99,.005,0,.001,0,0,0],[.001,.001,.151,.833,.005,.004,0,0,.005],[0,.001,.005,.012,.949,.026,.004,.002,.001],[.001,0,.001,0,.009,.968,.004,0,.017],[0,0,.001,.001,.001,.015,.97,.005,.007],[0,0,.001,.002,.001,0,.027,.962,.007]]},
      {label:"Self / pronoun",attention:[[.465,.005,.002,.505,.015,.001,.001,.004,.003],[.003,.819,.002,.002,.17,0,.002,.002,.001],[.001,0,.983,0,0,.004,0,.001,.01],[.427,.005,.001,.56,.006,0,0,0,.001],[.002,.342,.001,.001,.651,0,.001,0,.002],[.004,.001,.032,0,0,.95,0,0,.012],[.04,.373,.035,.013,.107,.002,.409,.013,.008],[.012,.032,.023,.002,.005,.002,.001,.92,.003],[.002,.001,.049,.001,.002,.006,.001,.001,.937]]},
      {label:"Broad context",attention:[[.436,.136,.357,.004,.012,.007,.001,.001,.047],[.888,.016,.062,.032,0,0,0,0,.001],[.006,.923,.039,.001,.029,.001,0,0,.001],[.003,.002,.949,.032,.006,.008,0,0,0],[.013,.001,.016,.962,.003,.004,0,0,0],[0,.005,.025,.006,.578,.343,.023,.016,.003],[0,0,.005,.001,.003,.973,.003,.001,.013],[0,.001,.001,0,.004,.012,.962,.02,.001],[.001,.006,.002,0,.012,.071,.214,.665,.029]]},
    ],
  },
  {
    words: ["The","ball","hit","the","window","and","it","broke"],
    guide: 'Click "it" — it attends to "ball" (55%) and "window" (14%), weighing which object broke.',
    headGuides: {
      "Next word": "The forward chain — \"it\" attends to \"broke\" (100%).",
      "Previous word": '"it" attends to "and" (97%) — the word right before it.',
      "Self / pronoun": '"it" attends to "ball" (55%) and "window" (14%) — trying to figure out which object shattered.',
      "Broad context": '"it" attends to "and" (85%) — connecting to the sentence structure.',
    },
    heads: [
      {label:"Next word",attention:[[0,1,0,0,0,0,0,0],[0,0,.999,0,0,0,0,0],[0,0,0,1,0,0,0,0],[0,0,0,0,1,0,0,0],[0,0,0,0,0,1,0,0],[0,0,0,0,0,0,1,0],[0,0,0,0,0,0,0,1],[0,0,.001,.058,0,.002,.043,.896]]},
      {label:"Previous word",attention:[[.883,.007,.089,.001,.002,.008,0,.009],[.971,.007,.01,.004,.001,.007,0,0],[.055,.924,.005,.004,.003,.002,.005,.002],[.001,.007,.972,.013,.001,.003,0,.003],[.002,.001,.036,.946,.003,.01,0,.001],[.001,.002,.005,.059,.893,.035,.004,.001],[0,0,.001,.001,.019,.966,.002,.011],[0,.003,0,0,.003,.016,.955,.022]]},
      {label:"Self / pronoun",attention:[[.64,.035,.004,.221,.014,.029,.046,.009],[.019,.903,.007,.016,.015,.004,.029,.007],[0,0,.939,0,0,0,0,.06],[.185,.04,.006,.72,.025,.01,.008,.006],[.005,.002,.001,.005,.979,.003,.002,.003],[.004,.005,.001,.001,.001,.98,.002,.005],[.169,.553,.012,.07,.138,.004,.05,.003],[.002,.001,.097,0,.001,.006,.001,.892]]},
      {label:"Broad context",attention:[[.403,.044,.174,.007,.05,.085,.009,.228],[.911,.037,.02,.019,.004,.003,.001,.006],[.002,.967,.019,.001,.01,0,.001,0],[.01,.035,.818,.026,.05,.052,.002,.008],[.038,.089,.063,.693,.05,.044,.009,.014],[.001,.007,.03,.011,.877,.058,.006,.012],[.002,0,.003,.001,.01,.85,.005,.129],[.004,.023,.002,.005,.172,.065,.605,.124]]},
    ],
  },
  {
    words: ["The","cat","knocked","the","vase","off","the","table","and","it","shattered"],
    guide: 'Click "it" — it attends to "cat" (53%) and "vase" (13%). The model weighs which object shattered (a tricky pronoun — it\'s actually the vase!).',
    headGuides: {
      "Next word": "The forward chain — \"it\" attends to \"shattered\" (100%).",
      "Previous word": '"it" attends to "and" (98%) — the word right before it.',
      "Self / pronoun": '"it" splits between "cat" (53%), "the" (18%), and "vase" (13%). The model is weighing multiple nouns to resolve the pronoun.',
      "Broad context": '"it" attends to "and" (93%) — the structural connector.',
    },
    heads: [
      {label:"Next word",attention:[[0,1,0,0,0,0,0,0,0,0,0],[0,0,1,0,0,0,0,0,0,0,0],[0,0,0,1,0,0,0,0,0,0,0],[0,0,0,0,1,0,0,0,0,0,0],[0,0,0,0,0,1,0,0,0,0,0],[0,0,0,0,0,0,1,0,0,0,0],[0,0,0,0,0,0,0,1,0,0,0],[0,0,0,0,0,0,0,0,1,0,0],[0,0,0,0,0,0,0,0,0,1,0],[0,0,0,0,0,0,0,0,0,0,1],[.004,.001,0,0,0,0,.005,0,.049,.014,.927]]},
      {label:"Previous word",attention:[[.881,.005,.022,.001,.001,.003,0,0,.002,.001,.084],[.992,.001,.004,.001,0,0,0,0,0,0,.001],[.054,.897,.034,.01,.004,0,0,0,0,0,.001],[.001,.003,.989,.004,.001,.002,0,0,0,0,0],[.005,.003,.019,.964,.003,.002,.001,0,.001,0,0],[0,0,0,.003,.994,.002,0,0,0,0,0],[0,0,.003,0,.005,.983,.002,.001,.003,0,.004],[0,0,0,.002,.002,.068,.9,.001,.022,.001,.003],[0,0,.001,.003,.007,.014,.092,.657,.178,.033,.016],[0,0,0,0,0,.001,0,.005,.979,.004,.011],[.004,.001,0,0,.004,0,.005,.016,.083,.818,.068]]},
      {label:"Self / pronoun",attention:[[.7,.01,.003,.164,.015,.001,.054,.006,.016,.026,.007],[.001,.992,0,0,.001,0,0,.002,0,.003,.001],[.003,.001,.885,.001,.001,.004,.001,.003,.009,.001,.092],[.175,.015,.004,.682,.028,.001,.071,.006,.005,.009,.004],[.039,.072,.016,.07,.568,.002,.019,.175,.008,.013,.018],[0,0,.011,0,0,.963,.001,.002,0,0,.022],[.116,.045,.008,.328,.051,.028,.368,.042,.006,.004,.004],[.003,.028,.003,.002,.01,.001,.002,.945,.001,.002,.002],[.025,.056,.04,.003,.008,.002,.001,.002,.843,.003,.018],[.118,.528,.012,.184,.129,.003,.007,.008,.001,.008,.002],[.016,.005,.236,.004,.003,.018,.001,.005,.01,.002,.699]]},
      {label:"Broad context",attention:[[.393,.039,.049,.003,.006,.002,0,.006,.033,.004,.465],[.945,.033,.004,.01,.002,0,0,0,0,0,.007],[.002,.914,.066,.004,.01,0,0,.001,0,.001,.001],[.005,.026,.89,.062,.007,.007,0,0,0,0,.003],[.007,.006,.024,.928,.028,.002,.004,.001,0,0,.001],[0,.005,.024,.003,.912,.039,.002,.012,.001,.001,0],[0,0,.013,.001,.042,.861,.01,.041,.03,0,.002],[.008,.001,.001,.008,.079,.093,.727,.051,.011,.001,.02],[0,.002,.006,0,.07,.026,.016,.785,.03,.006,.058],[0,0,.001,0,0,.013,0,.006,.928,.006,.046],[.003,.01,.001,.001,.007,.004,.003,.081,.032,.763,.094]]},
    ],
  },
  {
    words: ["The","boy","gave","the","girl","a","book","because","she","wanted","it"],
    guide: 'Two pronouns: click "she" — it attends to "girl" (45%) and "boy" (7%). Click "it" — it splits between "book" (37%) and itself (39%).',
    headGuides: {
      "Next word": "The forward chain. \"it\" at the end mostly attends to itself (98%).",
      "Previous word": '"she" attends to "because" (99%). "it" attends to "wanted" (98%).',
      "Self / pronoun": '"she" attends to "girl" (45%) and itself (42%) — finding the female referent. "it" splits between "book" (37%) and itself (39%).',
      "Broad context": '"she" attends to "because" (95%). "it" attends to "wanted" (66%).',
    },
    heads: [
      {label:"Next word",attention:[[0,1,0,0,0,0,0,0,0,0,0],[0,0,1,0,0,0,0,0,0,0,0],[0,0,0,1,0,0,0,0,0,0,0],[0,0,0,0,1,0,0,0,0,0,0],[0,0,0,0,0,1,0,0,0,0,0],[0,0,0,0,0,0,1,0,0,0,0],[0,0,0,0,0,0,0,1,0,0,0],[0,0,0,0,0,0,0,0,1,0,0],[0,0,0,0,0,0,0,0,0,1,0],[0,0,0,0,0,0,0,0,0,0,1],[.001,0,0,0,0,0,.001,.001,.003,.01,.983]]},
      {label:"Previous word",attention:[[.666,.008,.138,.001,.003,.001,0,.001,.001,.051,.13],[.96,.005,.024,.005,0,.003,0,0,0,0,.002],[.015,.949,.031,.002,.001,0,.002,0,0,0,0],[0,.001,.995,.002,.001,0,0,0,0,0,0],[.001,0,.048,.947,.002,.002,0,0,0,0,0],[0,0,.001,.013,.983,.001,0,.001,0,0,0],[.014,.001,.003,.07,.131,.731,.011,.019,.004,.002,.014],[0,0,.001,.001,.001,.013,.934,.034,.013,.001,.001],[0,0,0,0,0,0,.003,.993,.001,.002,.001],[0,0,0,0,0,0,.005,.022,.83,.115,.027],[0,0,0,0,0,0,0,.01,.001,.975,.013]]},
      {label:"Self / pronoun",attention:[[.378,.004,.001,.587,.015,.007,.001,0,.001,0,.005],[0,.817,0,0,.182,0,.001,0,0,0,0],[.001,0,.953,.001,.001,.002,.005,.002,0,.022,.012],[.387,.007,.001,.58,.008,.003,.007,0,0,0,.005],[.001,.449,0,0,.549,0,0,0,0,0,0],[.005,.002,.003,.003,.003,.978,.003,.001,0,0,.002],[0,.001,.004,0,0,.001,.992,0,0,0,.001],[.003,.001,.025,.001,0,.001,0,.964,0,.002,.001],[.022,.071,.016,.009,.448,.003,.001,0,.422,0,.006],[.001,.009,.216,.001,.01,.001,.002,.004,0,.748,.008],[.04,.014,.023,.122,.032,.008,.369,0,0,0,.391]]},
      {label:"Broad context",attention:[[.375,.064,.075,.002,.027,.002,.019,.007,0,.008,.42],[.801,.076,.046,.055,.005,.003,.001,0,0,0,.012],[.009,.953,.025,.003,.004,.002,.003,0,0,0,.001],[.012,.012,.809,.047,.105,.009,.001,.001,0,0,.004],[.013,.001,.035,.851,.007,.092,0,0,0,0,0],[.001,.002,.035,.019,.802,.09,.045,.004,0,0,.002],[.005,.001,.008,.048,.016,.903,.009,.007,0,.001,.002],[0,0,.001,0,.004,.01,.898,.072,.01,.002,.003],[0,0,0,0,.001,.001,.026,.946,.002,.008,.016],[0,.001,0,0,0,0,.004,.009,.98,.005,.001],[.001,0,0,0,.001,.003,.014,.048,.001,.657,.276]]},
    ],
  },
  {
    words: ["The","chef","who","won","the","competition","opened","a","restaurant"],
    guide: 'Click "who" on the pronoun head — it links back to "chef" (implicit). Click "opened" — it attends to itself (97%). Try the position heads to see structural patterns.',
    headGuides: {
      "Next word": "The familiar forward chain. Every word passes its information to the next.",
      "Previous word": '"who" attends to "chef" (98%). "opened" attends to "competition" (93%) — linking across the relative clause.',
      "Self / pronoun": '"chef" attends to itself (82%) and "restaurant" (16%) — connecting subject to object. "who" connects to its antecedent.',
      "Broad context": '"who" attends to "chef" (93%). "opened" splits across the sentence — gathering structural context.',
    },
    heads: [
      {label:"Next word",attention:[[0,1,0,0,0,0,0,0,0],[0,0,1,0,0,0,0,0,0],[0,0,0,.999,0,0,0,0,0],[0,0,0,0,1,0,0,0,0],[0,0,0,0,0,1,0,0,0],[0,0,0,0,0,0,1,0,0],[0,0,0,0,0,0,0,1,0],[0,0,0,0,0,0,0,0,1],[.001,0,0,.002,.017,.001,.055,.018,.906]]},
      {label:"Previous word",attention:[[.88,.016,.009,.035,.001,.004,.001,0,.054],[.925,.05,.012,.007,.002,.003,0,0,.001],[.008,.976,.009,.004,0,.001,0,0,0],[.005,.05,.877,.029,.006,.028,.002,.001,.001],[0,.002,.004,.983,.002,.001,.003,0,.006],[.002,.003,.002,.293,.639,.038,.007,.005,.012],[.001,.002,.007,.005,.028,.931,.008,.006,.011],[0,0,0,.001,0,.001,.992,.001,.004],[0,0,.003,.002,.009,.003,.007,.929,.046]]},
      {label:"Self / pronoun",attention:[[.918,.001,.005,0,.04,.007,.002,.018,.008],[.005,.82,.006,0,0,.003,.003,.002,.16],[.016,.003,.96,0,.001,.012,.001,.004,.004],[.003,0,0,.962,0,.002,.028,.002,.002],[.385,.004,.003,.001,.548,.014,.004,.017,.025],[.023,.003,.016,.002,.005,.936,.003,.001,.011],[.001,0,0,.017,0,.001,.967,.002,.012],[.067,.001,.003,.001,.012,.001,.006,.899,.009],[.005,.021,.001,0,.001,.004,.015,.001,.952]]},
      {label:"Broad context",attention:[[.464,.057,.037,.013,0,.006,.023,.005,.395],[.912,.021,.03,.007,.004,.004,.001,.005,.016],[.013,.931,.031,.007,.002,.014,0,0,.001],[.001,.024,.94,.024,.005,.006,0,0,0],[.001,.022,.064,.854,.029,.007,.021,.001,.001],[.013,.006,.033,.147,.668,.006,.017,.108,.003],[.003,.002,.006,.014,.007,.201,.447,.216,.104],[0,0,0,.003,0,.001,.967,.004,.025],[.004,0,0,.001,.004,.005,.057,.848,.079]]},
    ],
  },
  {
    words: ["The","old","cat","sat","on","the","warm","mat","and","slept"],
    guide: 'Click "slept" — it attends to "sat" (10%) and itself (77%), connecting the two actions of the same subject. Try "mat" — it connects back to "cat" (8%).',
    headGuides: {
      "Next word": "The standard chain. \"slept\" (last word) mostly attends to itself (91%).",
      "Previous word": '"cat" attends to "old" (65%) — gathering its modifier. "slept" attends to "and" (99%).',
      "Self / pronoun": '"mat" attends to itself (87%) and "cat" (8%) — linking object to subject. "slept" attends to "sat" (10%) — connecting the two verbs.',
      "Broad context": '"sat" attends to "cat" (91%) — connecting verb to subject. "warm" attends to "the" (87%).',
    },
    heads: [
      {label:"Next word",attention:[[0,1,0,0,0,0,0,0,0,0],[0,0,1,0,0,0,0,0,0,0],[0,0,0,.999,0,0,0,0,0,0],[0,0,0,0,1,0,0,0,0,0],[0,0,0,0,0,1,0,0,0,0],[0,0,0,0,0,0,1,0,0,0],[0,0,0,0,0,0,0,1,0,0],[0,0,0,0,0,0,0,0,1,0],[0,0,0,0,0,0,0,0,0,1],[0,.001,0,0,.007,.043,0,.002,.034,.913]]},
      {label:"Previous word",attention:[[.931,.012,.004,.001,.018,.001,0,0,.001,.032],[.994,.005,0,0,0,0,0,0,0,0],[.336,.654,.002,.001,.003,.002,.001,0,0,0],[.056,.037,.856,.024,.003,.011,.005,.001,.009,0],[0,0,.001,.998,.001,0,0,0,0,0],[.001,0,0,.003,.971,.017,.001,.001,.001,.006],[.006,.002,.005,.002,.127,.822,.02,.006,.007,.003],[.001,.007,.005,.001,.013,.208,.741,.005,.015,.004],[0,.001,.003,.008,.006,.011,.065,.45,.441,.014],[0,0,0,0,0,0,0,.003,.992,.004]]},
      {label:"Self / pronoun",attention:[[.893,.009,.003,.001,.002,.081,.002,0,.002,.006],[.001,.982,.002,0,0,0,.007,0,.001,.006],[0,0,.998,0,0,0,0,.001,0,0],[.001,0,.002,.911,.001,.001,0,.005,.001,.078],[.001,0,0,.002,.991,.003,0,0,0,.002],[.202,.001,.017,.028,.018,.722,.002,.001,.004,.006],[.005,.01,.005,.001,0,.001,.963,.002,.001,.011],[.001,0,.081,.036,0,0,.001,.865,.001,.013],[.029,.008,.081,.101,.001,.006,.003,.002,.758,.011],[.009,.008,.027,.103,.001,.002,.046,.031,.002,.773]]},
      {label:"Broad context",attention:[[.422,.285,.074,.032,.009,.001,.001,.002,.004,.171],[.916,.073,.001,.005,.001,.002,.001,0,.001,.002],[.027,.948,.013,.005,0,0,.007,0,0,.001],[.007,.041,.911,.031,0,0,0,.005,.001,.003],[.001,.003,.05,.927,.009,.003,.002,.002,0,.003],[.008,.03,.061,.044,.736,.093,.007,.004,.003,.015],[.029,.017,.002,.001,.012,.874,.05,.002,.007,.006],[0,.005,.001,0,0,.001,.991,0,0,.001],[0,0,.003,.001,0,.001,.008,.965,.013,.009],[.001,.002,.003,.002,.001,.001,.003,.008,.947,.033]]},
    ],
  },
];

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

function weightToBg(w: number): React.CSSProperties {
  if (w < 0.02) return {};
  const alpha = Math.min(0.12 + w * 0.73, 0.85);
  return {
    backgroundColor: `rgba(99, 102, 241, ${alpha})`,
    color: w > 0.4 ? "white" : undefined,
    borderRadius: 4,
  };
}

const selectedStyle: React.CSSProperties = {
  borderRadius: 4,
  outline: "2.5px solid var(--color-accent)",
  outlineOffset: 2,
  fontWeight: 700,
};

export function BertAttention({ excludeHeads, onlySentencesWithWord }: { excludeHeads?: string[]; onlySentencesWithWord?: string } = {}) {
  const filteredSentences = onlySentencesWithWord
    ? SENTENCES.filter((s) => s.words.some(w => w.toLowerCase() === onlySentencesWithWord.toLowerCase()))
    : SENTENCES;

  const [sentIdx, setSentIdx] = useState(0);
  const [headIdx, setHeadIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);

  const sentence = filteredSentences[sentIdx] ?? filteredSentences[0];
  const filteredHeads = excludeHeads
    ? sentence.heads.filter((h) => !excludeHeads.includes(h.label))
    : sentence.heads;
  const head = filteredHeads[headIdx] ?? filteredHeads[0];
  const attnRow = selected !== null ? head.attention[selected] : null;
  const headGuide = sentence.headGuides[head.label];

  const handleReset = useCallback(() => {
    setSentIdx(0);
    setHeadIdx(0);
    setSelected(null);
  }, []);

  return (
    <WidgetContainer
      title="Real Attention Heads (BERT)"
      description="Attention weights from a real language model. Different heads learn to look for different things."
      onReset={handleReset}
    >
      <div className="flex flex-col gap-4">
        {/* Sentence tabs */}
        <div className="flex flex-wrap gap-1.5">
          {filteredSentences.map((s, i) => (
            <button
              key={i}
              onClick={() => { setSentIdx(i); setSelected(null); }}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                i === sentIdx
                  ? "bg-accent text-white"
                  : "bg-foreground/5 text-muted hover:bg-foreground/10 hover:text-foreground"
              }`}
            >
              {s.words.slice(0, 3).join(" ")}...
            </button>
          ))}
        </div>

        {/* Head selector (hidden when only one head) */}
        {filteredHeads.length > 1 && (
          <div className="flex flex-wrap gap-1.5">
            {filteredHeads.map((h, i) => (
              <button
                key={i}
                onClick={() => { setHeadIdx(i); setSelected(null); }}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                  i === headIdx
                    ? "border-indigo-400 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300"
                    : "border-border text-muted hover:border-foreground/20 hover:text-foreground"
                }`}
              >
                {h.label}
              </button>
            ))}
          </div>
        )}

        {/* Words */}
        <div className="flex flex-wrap items-end gap-x-1 gap-y-4 rounded-lg border border-border bg-surface px-5 py-5">
          {sentence.words.map((word, i) => {
            const isSelected = selected === i;
            const weight = attnRow?.[i] ?? 0;

            return (
              <span key={`${sentIdx}-${headIdx}-${i}`} className="relative inline-flex flex-col items-center">
                {/* Percentage above */}
                {attnRow != null && !isSelected && weight >= 0.02 && (
                  <span
                    className="mb-1 font-mono text-[10px] font-bold leading-none"
                    style={{ color: weight > 0.3 ? "rgb(99, 102, 241)" : "var(--color-muted)" }}
                  >
                    {Math.round(weight * 100)}%
                  </span>
                )}
                {isSelected && (
                  <span className="mb-1 font-mono text-[10px] font-bold leading-none text-accent">
                    query
                  </span>
                )}
                {attnRow != null && !isSelected && weight < 0.02 && (
                  <span className="mb-1 text-[10px] leading-none text-transparent">·</span>
                )}
                {attnRow == null && (
                  <span className="mb-1 text-[10px] leading-none text-transparent">·</span>
                )}
                <button
                  onClick={() => setSelected(isSelected ? null : i)}
                  className="cursor-pointer px-1.5 py-1 text-lg transition-all"
                  style={isSelected ? selectedStyle : weightToBg(weight)}
                >
                  {word}
                </button>
              </span>
            );
          })}
        </div>

        {/* Per-head guide */}
        <div className="rounded-lg border border-border bg-foreground/[0.02] px-4 py-3 text-sm text-foreground">
          {headGuide}
        </div>

        {/* Per-sentence guide */}
        <div className="rounded-lg border border-accent/20 bg-accent/5 px-4 py-3 text-xs text-muted">
          <strong className="text-foreground">Try this:</strong> {sentence.guide}
        </div>
      </div>
    </WidgetContainer>
  );
}
